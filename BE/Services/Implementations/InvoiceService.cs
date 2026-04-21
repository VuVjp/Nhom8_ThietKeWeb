using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Services.Implementations;

public class InvoiceService : IInvoiceService
{
    private readonly IInvoiceRepository _repository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IVoucherRepository _voucherRepository;
    private readonly Data.AppDbContext _context;
    private readonly decimal _taxRate = 0.1m; // 10% tax

    public InvoiceService(IInvoiceRepository repository, IBookingRepository bookingRepository, IVoucherRepository voucherRepository, Data.AppDbContext context)
    {
        _repository = repository;
        _bookingRepository = bookingRepository;
        _voucherRepository = voucherRepository;
        _context = context;
    }

    public async Task<Invoice> CreateInvoiceAsync(int bookingId)
    {
        var booking = await _bookingRepository.GetBookingByIdWithDetailsAsync(bookingId, includeRoom: true);
        if (booking == null) throw new Exception("Booking not found");

        if (booking.InvoiceType == "Split")
        {
            foreach (var detail in booking.BookingDetails)
            {
                var existing = await _repository.GetByBookingDetailIdAsync(detail.Id);
                if (existing == null)
                {
                    var invoice = new Invoice
                    {
                        BookingId = bookingId,
                        InvoiceCode = $"INV-{detail.Id}-{DateTime.Now:yyyyMMdd-HHmmss}",
                        CreatedAt = DateTime.Now,
                        Status = "Pending"
                    };
                    await _repository.AddAsync(invoice);
                    await _repository.SaveChangesAsync(); // Save to get ID
                    
                    detail.InvoiceId = invoice.Id;
                    await CalculateAmountsAsync(invoice, booking);
                    _repository.Update(invoice);
                }
            }
            await _repository.SaveChangesAsync();
            var firstDetail = booking.BookingDetails.First();
            return (await _repository.GetByBookingDetailIdAsync(firstDetail.Id))!;
        }
        else
        {
            var existing = await _repository.GetByBookingIdAsync(bookingId);
            if (existing != null) return existing;

            var invoice = new Invoice
            {
                BookingId = bookingId,
                InvoiceCode = $"INV-{DateTime.Now:yyyyMMdd-HHmmss}",
                CreatedAt = DateTime.Now,
                Status = "Pending"
            };

            await _repository.AddAsync(invoice);
            await _repository.SaveChangesAsync();

            // Link ALL rooms to this consolidated invoice
            foreach (var detail in booking.BookingDetails)
            {
                detail.InvoiceId = invoice.Id;
            }

            await CalculateAmountsAsync(invoice, booking);
            _repository.Update(invoice);
            await _repository.SaveChangesAsync();
            return invoice;
        }
    }

    public async Task<Invoice?> GetInvoiceByBookingIdAsync(int bookingId)
    {
        return await _repository.GetByBookingIdAsync(bookingId);
    }

    public async Task<Invoice?> GetInvoiceByIdAsync(int id)
    {
        return await _repository.GetByIdAsync(id);
    }

    public async Task<IEnumerable<Invoice>> GetAllInvoicesAsync()
    {
        return await _repository.GetAllAsync();
    }

    public async Task<PaginatedResultDto<Invoice>> GetPagedInvoicesAsync(InvoiceQueryDto query)
    {
        return await _repository.GetPagedInvoicesAsync(query);
    }

    public async Task<bool> CompleteInvoiceByIdAsync(int id)
    {
        var invoice = await _repository.GetByIdAsync(id);
        if (invoice == null || invoice.Status == "Completed") return false;

        var booking = await _bookingRepository.GetBookingByIdWithDetailsAsync(invoice.BookingId!.Value, includeRoom: true);
        if (booking == null) return false;

        await CalculateAmountsAsync(invoice, booking);

        var outstandingAmount = await GetOutstandingAmountAsync(invoice.Id);
        if (outstandingAmount > 0)
        {
            throw new ConflictException($"Invoice #{invoice.Id} still has outstanding amount: {outstandingAmount:N0}");
        }

        invoice.Status = "Completed";
        invoice.CompletedAt = DateTime.Now;
        
        _repository.Update(invoice);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<decimal> GetPaidAmountAsync(int invoiceId)
    {
        return await _context.Set<Payment>()
            .Where(p => p.InvoiceId == invoiceId)
            .Where(p => p.Status == null || p.Status == "Completed")
            .SumAsync(p => (decimal?)p.AmountPaid) ?? 0m;
    }

    public async Task<decimal> GetAllocatedDepositAsync(int invoiceId)
    {
        var invoice = await _context.Set<Invoice>()
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice?.BookingId == null)
        {
            return 0m;
        }

        var booking = await _context.Set<Booking>()
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == invoice.BookingId.Value);

        var deposit = booking?.Deposit ?? 0m;
        if (deposit <= 0)
        {
            return 0m;
        }

        var bookingInvoices = await _context.Set<Invoice>()
            .AsNoTracking()
            .Where(i => i.BookingId == invoice.BookingId.Value)
            .Select(i => new
            {
                i.Id,
                FinalTotal = i.FinalTotal ?? 0m
            })
            .ToListAsync();

        if (bookingInvoices.Count == 0)
        {
            return 0m;
        }

        var totalFinal = bookingInvoices.Sum(i => Math.Max(0m, i.FinalTotal));
        if (totalFinal <= 0)
        {
            return 0m;
        }

        var ordered = bookingInvoices
            .OrderByDescending(i => i.FinalTotal)
            .ThenBy(i => i.Id)
            .ToList();

        var allocations = new Dictionary<int, decimal>(ordered.Count);
        decimal remaining = Math.Round(deposit, 2, MidpointRounding.AwayFromZero);

        for (int idx = 0; idx < ordered.Count; idx++)
        {
            var current = ordered[idx];
            decimal allocation;

            if (idx == ordered.Count - 1)
            {
                allocation = remaining;
            }
            else
            {
                allocation = Math.Round(deposit * (Math.Max(0m, current.FinalTotal) / totalFinal), 2, MidpointRounding.AwayFromZero);
                remaining -= allocation;
            }

            allocation = Math.Max(0m, Math.Min(allocation, Math.Max(0m, current.FinalTotal)));
            allocations[current.Id] = allocation;
        }

        return allocations.TryGetValue(invoiceId, out var value) ? value : 0m;
    }

    public async Task<decimal> GetOutstandingAmountAsync(int invoiceId)
    {
        var invoice = await _repository.GetByIdAsync(invoiceId);
        if (invoice == null)
        {
            throw new NotFoundException($"Invoice with ID {invoiceId} not found");
        }

        var finalTotal = invoice.FinalTotal ?? 0m;
        var paidAmount = await GetPaidAmountAsync(invoiceId);
        var allocatedDeposit = await GetAllocatedDepositAsync(invoiceId);

        return Math.Max(0m, finalTotal - paidAmount - allocatedDeposit);
    }

    public async Task UpdateInvoiceAmountsAsync(int bookingId)
    {
        var booking = await _bookingRepository.GetBookingByIdWithDetailsAsync(bookingId, includeRoom: true);
        if (booking == null) return;

        var invoices = await _context.Set<Invoice>()
            .Where(i => i.BookingId == bookingId)
            .ToListAsync();

        foreach (var invoice in invoices)
        {
            if (invoice.Status != "Completed")
            {
                await CalculateAmountsAsync(invoice, booking);
                _repository.Update(invoice);
            }
        }

        await _repository.SaveChangesAsync();
    }

    public async Task<bool> SplitInvoiceAsync(int invoiceId)
    {
        var invoice = await _repository.GetByIdAsync(invoiceId);
        if (invoice == null || invoice.BookingId == null || invoice.Status == "Completed") return false;

        var booking = await _bookingRepository.GetBookingByIdWithDetailsAsync(invoice.BookingId.Value, includeRoom: true);
        if (booking == null || booking.BookingDetails.Count < 2) return false;

        // "Split All" logic: every room gets its own invoice
        // Skip the first room (it stays on the current invoice)
        var details = booking.BookingDetails.OrderBy(d => d.Id).ToList();
        var moveDetails = details.Skip(1).ToList();

        foreach (var detail in moveDetails)
        {
            var newInvoice = new Invoice
            {
                BookingId = booking.Id,
                InvoiceCode = $"INV-{detail.Id}-{DateTime.Now:yyyyMMdd-HHmmss}",
                CreatedAt = DateTime.Now,
                Status = "Pending"
            };
            await _repository.AddAsync(newInvoice);
            await _repository.SaveChangesAsync();

            detail.InvoiceId = newInvoice.Id;
            await CalculateAmountsAsync(newInvoice, booking);
            _repository.Update(newInvoice);
        }

        // Recalculate original
        await CalculateAmountsAsync(invoice, booking);
        _repository.Update(invoice);
        await _repository.SaveChangesAsync();

        return true;
    }

    public async Task<bool> SplitMultipleAsync(int invoiceId, List<int> roomDetailIds)
    {
        var sourceInvoice = await _repository.GetByIdAsync(invoiceId);
        if (sourceInvoice == null || sourceInvoice.BookingId == null || sourceInvoice.Status == "Completed" || roomDetailIds == null || roomDetailIds.Count == 0) return false;

        var booking = await _bookingRepository.GetBookingByIdWithDetailsAsync(sourceInvoice.BookingId.Value, includeRoom: true);
        if (booking == null) return false;

        // Ensure we are not moving ALL rooms (must leave at least one)
        var currentRooms = booking.BookingDetails.Where(bd => bd.InvoiceId == invoiceId).Select(bd => bd.Id).ToList();
        if (roomDetailIds.All(rid => currentRooms.Contains(rid)) && roomDetailIds.Count == currentRooms.Count)
        {
            return false; // Cannot move all rooms
        }

        var newInvoice = new Invoice
        {
            BookingId = booking.Id,
            InvoiceCode = $"INV-P-{DateTime.Now:yyyyMMdd-HHmmss}",
            CreatedAt = DateTime.Now,
            Status = "Pending"
        };
        await _repository.AddAsync(newInvoice);
        await _repository.SaveChangesAsync();

        foreach (var rid in roomDetailIds)
        {
            var detail = booking.BookingDetails.FirstOrDefault(bd => bd.Id == rid);
            if (detail != null)
            {
                detail.InvoiceId = newInvoice.Id;
            }
        }

        await CalculateAmountsAsync(newInvoice, booking);
        await CalculateAmountsAsync(sourceInvoice, booking);
        
        _repository.Update(newInvoice);
        _repository.Update(sourceInvoice);
        await _repository.SaveChangesAsync();

        return true;
    }

    private async Task CalculateAmountsAsync(Invoice invoice, Booking booking)
    {
        // Filter elements based on which rooms are assigned to this specific invoice
        var targetDetails = booking.BookingDetails.Where(bd => bd.InvoiceId == invoice.Id).ToList();

        // 1. Room Amount
        decimal totalRoomAmount = 0;
        foreach (var detail in targetDetails)
        {
            var effectiveCheckOut = detail.ActualCheckOutDate ?? detail.CheckOutDate;
            var duration = effectiveCheckOut - detail.CheckInDate;
            if (duration <= TimeSpan.Zero) continue;

            if (detail.CheckInDate.Date == effectiveCheckOut.Date)
            {
                var hours = (decimal)Math.Ceiling(duration.TotalHours);
                var hourlyRate = Math.Ceiling(detail.PricePerNight / 24m);
                totalRoomAmount += Math.Max(1, hours) * hourlyRate;
            }
            else
            {
                var nights = (decimal)Math.Ceiling(duration.TotalDays);
                totalRoomAmount += Math.Max(1, nights) * detail.PricePerNight;
            }
        }
        invoice.TotalRoomAmount = totalRoomAmount;

        // 2. Service Amount
        decimal totalServiceAmount = targetDetails
            .SelectMany(bd => bd.OrderServices)
            .Sum(os => os.TotalAmount);
        invoice.TotalServiceAmount = totalServiceAmount;

        // 3. Loss and Damage Amount
        decimal totalLossDamageAmount = targetDetails
            .SelectMany(bd => bd.LossAndDamages)
            .Sum(ld => ld.PenaltyAmount);
        invoice.TotalLossDamageAmount = totalLossDamageAmount;

        // 4. Discount Amount (Voucher + Membership)
        decimal discountAmount = 0;
        
        // Voucher Discount: Applied to the subtotal of room amount in this specific invoice
        if (booking.VoucherId.HasValue)
        {
            // Simple rule: Apply the voucher to the FIRST invoice created for this booking 
            // (the one with the earliest ID that has rooms)
            var firstInvoiceId = booking.Invoices?.OrderBy(i => i.Id).FirstOrDefault()?.Id ?? invoice.Id;
            bool canApplyVoucher = invoice.Id == firstInvoiceId;

            if (canApplyVoucher)
            {
                var voucher = await _voucherRepository.GetByIdAsync(booking.VoucherId.Value);
                if (voucher != null)
                {
                    if (voucher.DiscountType == "Percentage")
                    {
                        discountAmount += Math.Round(totalRoomAmount * (voucher.DiscountValue / 100m), 2);
                    }
                    else if (voucher.DiscountType == "Fixed")
                    {
                        discountAmount += Math.Min(voucher.DiscountValue, totalRoomAmount);
                    }
                }
            }
        }

        // Membership Discount (Applied to Room Amount of this specific invoice)
        if (booking.User?.Membership != null)
        {
            var membershipDiscountPercent = booking.User.Membership.DiscountPercent ?? 0;
            if (membershipDiscountPercent > 0)
            {
                discountAmount += Math.Round(totalRoomAmount * (membershipDiscountPercent / 100m), 2);
            }
        }
        invoice.DiscountAmount = discountAmount;

        // 5. Tax Amount (10% of subtotal)
        decimal subtotal = totalRoomAmount + totalServiceAmount + totalLossDamageAmount - discountAmount;
        invoice.TaxAmount = Math.Round(Math.Max(0, subtotal) * _taxRate, 2);

        // 6. Final Total
        invoice.FinalTotal = subtotal + invoice.TaxAmount;
    }
    public async Task<bool> CompleteInvoiceAsync(int invoiceId)
    {
        return await CompleteInvoiceByIdAsync(invoiceId);
    }
}
