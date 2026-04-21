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
    private readonly decimal _taxRate = 0.1m;

    private readonly Random _random = new();

    public InvoiceService(
        IInvoiceRepository repository,
        IBookingRepository bookingRepository,
        IVoucherRepository voucherRepository,
        Data.AppDbContext context)
    {
        _repository = repository;
        _bookingRepository = bookingRepository;
        _voucherRepository = voucherRepository;
        _context = context;
    }

    private string GenerateInvoiceCode(string prefix = "INV", int? suffixId = null)
    {
        var timestamp = DateTime.Now.ToString("yyyyMMdd-HHmmssfff");
        var randomStr = _random.Next(1000, 9999).ToString();

        return suffixId.HasValue
            ? $"{prefix}-{suffixId}-{timestamp}-{randomStr}"
            : $"{prefix}-{timestamp}-{randomStr}";
    }

    // ================= CREATE =================
    public async Task<Invoice> CreateInvoiceAsync(int bookingId)
    {
        var booking = await _bookingRepository.GetBookingByIdWithDetailsAsync(bookingId, true);
        if (booking == null) throw new Exception("Booking not found");

        if (booking.InvoiceType == "Split")
        {
            foreach (var detail in booking.BookingDetails)
            {
                var existing = await _repository.GetByBookingDetailIdAsync(detail.Id);
                if (existing != null) continue;

                var invoice = new Invoice
                {
                    BookingId = bookingId,
                    InvoiceCode = GenerateInvoiceCode("INV", detail.Id),
                    CreatedAt = DateTime.Now,
                    Status = "Pending"
                };

                await _repository.AddAsync(invoice);
                await _repository.SaveChangesAsync();

                detail.InvoiceId = invoice.Id;
                await CalculateAmountsAsync(invoice, booking);
            }

            await _repository.SaveChangesAsync();

            var first = booking.BookingDetails.First();
            return (await _repository.GetByBookingDetailIdAsync(first.Id))!;
        }
        else
        {
            var existing = await _repository.GetByBookingIdAsync(bookingId);
            if (existing != null) return existing;

            var invoice = new Invoice
            {
                BookingId = bookingId,
                InvoiceCode = GenerateInvoiceCode(),
                CreatedAt = DateTime.Now,
                Status = "Pending"
            };

            await _repository.AddAsync(invoice);
            await _repository.SaveChangesAsync();

            foreach (var d in booking.BookingDetails)
                d.InvoiceId = invoice.Id;

            await CalculateAmountsAsync(invoice, booking);

            await _repository.SaveChangesAsync();
            return invoice;
        }
    }

    // ================= READ =================
    public Task<Invoice?> GetInvoiceByIdAsync(int id) => _repository.GetByIdAsync(id);
    public Task<IEnumerable<Invoice>> GetAllInvoicesAsync() => _repository.GetAllAsync();
    public Task<Invoice?> GetInvoiceByBookingIdAsync(int bookingId) => _repository.GetByBookingIdAsync(bookingId);
    public Task<PaginatedResultDto<Invoice>> GetPagedInvoicesAsync(InvoiceQueryDto query)
        => _repository.GetPagedInvoicesAsync(query);

    // ================= COMPLETE =================
    public async Task<bool> CompleteInvoiceByIdAsync(int id)
    {
        var invoice = await _repository.GetByIdAsync(id);
        if (invoice == null || invoice.Status == "Completed") return false;

        var booking = invoice.Booking;
        if (booking == null) return false;

        await CalculateAmountsAsync(invoice, booking);

        var outstandingAmount = await GetOutstandingAmountAsync(invoice.Id);
        if (outstandingAmount > 0)
        {
            throw new ConflictException($"Invoice #{invoice.Id} still has outstanding amount: {outstandingAmount:N0}");
        }

        invoice.Status = "Completed";
        invoice.CompletedAt = DateTime.Now;

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
        var booking = await _bookingRepository.GetBookingByIdWithDetailsAsync(bookingId, true);
        if (booking == null) return;

        var invoices = await _context.Set<Invoice>()
            .Where(i => i.BookingId == bookingId)
            .ToListAsync();

        foreach (var invoice in invoices)
        {
            if (invoice.Status == "Completed") continue;
            await CalculateAmountsAsync(invoice, booking);
        }

        await _repository.SaveChangesAsync();
    }

    // ================= SPLIT ALL =================
    public async Task<bool> SplitInvoiceAsync(int invoiceId)
    {
        var invoice = await _repository.GetByIdAsync(invoiceId);
        if (invoice == null || invoice.Status == "Completed") return false;

        var booking = invoice.Booking;
        if (booking == null || booking.BookingDetails.Count < 2) return false;

        var moveDetails = booking.BookingDetails.OrderBy(x => x.Id).Skip(1).ToList();

        foreach (var detail in moveDetails)
        {
            var newInvoice = new Invoice
            {
                BookingId = booking.Id,
                InvoiceCode = GenerateInvoiceCode("INV", detail.Id),
                CreatedAt = DateTime.Now,
                Status = "Pending"
            };

            await _repository.AddAsync(newInvoice);
            detail.Invoice = newInvoice;
        }

        await _repository.SaveChangesAsync();

        foreach (var detail in moveDetails)
        {
            if (detail.Invoice == null) continue;
            await CalculateAmountsAsync(detail.Invoice, booking);
        }

        await CalculateAmountsAsync(invoice, booking);

        await _repository.SaveChangesAsync();
        return true;
    }

    // ================= SPLIT MULTIPLE =================
    public async Task<bool> SplitMultipleAsync(int invoiceId, List<int> roomDetailIds)
    {
        var source = await _repository.GetByIdAsync(invoiceId);
        if (source == null || source.Status == "Completed") return false;

        var booking = source.Booking;
        if (booking == null) return false;

        var newInvoice = new Invoice
        {
            BookingId = booking.Id,
            InvoiceCode = GenerateInvoiceCode("INV-P"),
            CreatedAt = DateTime.Now,
            Status = "Pending"
        };

        await _repository.AddAsync(newInvoice);
        await _repository.SaveChangesAsync();

        foreach (var id in roomDetailIds)
        {
            var detail = booking.BookingDetails.FirstOrDefault(x => x.Id == id);
            if (detail != null) detail.InvoiceId = newInvoice.Id;
        }

        await CalculateAmountsAsync(newInvoice, booking);
        await CalculateAmountsAsync(source, booking);

        await _repository.SaveChangesAsync();
        return true;
    }

    // ================= CALCULATE =================
    private async Task CalculateAmountsAsync(Invoice invoice, Booking booking)
    {
        var details = booking.BookingDetails
            .Where(bd => bd.InvoiceId == invoice.Id)
            .ToList();

        decimal room = 0;

        foreach (var d in details)
        {
            var end = d.ActualCheckOutDate ?? d.CheckOutDate;
            var duration = end - d.CheckInDate;
            if (duration <= TimeSpan.Zero) continue;

            if (d.CheckInDate.Date == end.Date)
            {
                var hours = Math.Ceiling((decimal)duration.TotalHours);
                var rate = Math.Ceiling(d.PricePerNight / 24m);
                room += Math.Max(1, hours) * rate;
            }
            else
            {
                var nights = Math.Ceiling((decimal)duration.TotalDays);
                room += Math.Max(1, nights) * d.PricePerNight;
            }
        }

        invoice.TotalRoomAmount = room;

        var service = details.SelectMany(x => x.OrderServices).Sum(x => x.TotalAmount);
        var damage = details.SelectMany(x => x.LossAndDamages).Sum(x => x.PenaltyAmount);

        invoice.TotalServiceAmount = service;
        invoice.TotalLossDamageAmount = damage;

        decimal discount = 0;

        if (booking.VoucherId.HasValue)
        {
            var voucher = await _voucherRepository.GetByIdAsync(booking.VoucherId.Value);
            if (voucher != null && voucher.DiscountType == "Percentage")
                discount += room * (voucher.DiscountValue / 100m);
        }

        if (booking.User?.Membership != null)
        {
            discount += room * ((booking.User.Membership.DiscountPercent ?? 0) / 100m);
        }

        invoice.DiscountAmount = discount;

        var subtotal = room + service + damage - discount;

        invoice.TaxAmount = Math.Max(0, subtotal) * _taxRate;
        invoice.FinalTotal = subtotal + invoice.TaxAmount;
    }

    public Task<bool> CompleteInvoiceAsync(int invoiceId)
        => CompleteInvoiceByIdAsync(invoiceId);
}