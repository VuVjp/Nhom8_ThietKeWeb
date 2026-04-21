using HotelManagement.Data;
using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Repositories.Implementations;

public class InvoiceRepository : Repository<Invoice>, IInvoiceRepository
{
    public InvoiceRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Invoice?> GetByBookingIdAsync(int bookingId)
    {
        return await _dbSet
            .Include(i => i.Booking)
                .ThenInclude(b => b!.User)
                    .ThenInclude(u => u!.Membership)
            .Include(i => i.Booking)
                .ThenInclude(b => b!.BookingDetails)
            .Include(i => i.BookingDetails)
                .ThenInclude(bd => bd.Room)
            .Include(i => i.BookingDetails)
                .ThenInclude(bd => bd.OrderServices)
                    .ThenInclude(os => os.OrderServiceDetails)
                        .ThenInclude(osd => osd.Service)
            .Include(i => i.BookingDetails)
                .ThenInclude(bd => bd.LossAndDamages)
                    .ThenInclude(ld => ld.RoomInventory)
            .FirstOrDefaultAsync(i => i.BookingId == bookingId && 
                i.BookingDetails.Any()); // At least some rooms
    }

    public async Task<Invoice?> GetByBookingDetailIdAsync(int bookingDetailId)
    {
        return await _dbSet
            .Include(i => i.Booking)
                .ThenInclude(b => b!.User)
                    .ThenInclude(u => u!.Membership)
            .Include(i => i.Booking)
                .ThenInclude(b => b!.BookingDetails)
            .Include(i => i.BookingDetails)
                .ThenInclude(bd => bd.Room)
            .Include(i => i.BookingDetails)
                .ThenInclude(bd => bd.OrderServices)
                    .ThenInclude(os => os.OrderServiceDetails)
                        .ThenInclude(osd => osd.Service)
            .Include(i => i.BookingDetails)
                .ThenInclude(bd => bd.LossAndDamages)
                    .ThenInclude(ld => ld.RoomInventory)
            .FirstOrDefaultAsync(i => i.BookingDetails.Any(bd => bd.Id == bookingDetailId));
    }

    public override async Task<Invoice?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(i => i.Booking)
                .ThenInclude(b => b!.User)
                    .ThenInclude(u => u!.Membership)
            .Include(i => i.Booking)
                .ThenInclude(b => b!.BookingDetails)
            .Include(i => i.BookingDetails)
                .ThenInclude(bd => bd.Room)
            .Include(i => i.BookingDetails)
                .ThenInclude(bd => bd.OrderServices)
                    .ThenInclude(os => os.OrderServiceDetails)
                        .ThenInclude(osd => osd.Service)
            .Include(i => i.BookingDetails)
                .ThenInclude(bd => bd.LossAndDamages)
                    .ThenInclude(ld => ld.RoomInventory)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<PaginatedResultDto<Invoice>> GetPagedInvoicesAsync(InvoiceQueryDto query)
    {
        var q = _dbSet
            .AsNoTracking()
            .AsSplitQuery()
            .Include(i => i.Booking)
                .ThenInclude(b => b!.BookingDetails)
            .Include(i => i.BookingDetails)
                .ThenInclude(bd => bd.Room)
            .AsQueryable();

        // Filtering
        if (!string.IsNullOrEmpty(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(i => 
                (i.InvoiceCode != null && i.InvoiceCode.ToLower().Contains(s)) ||
                (i.Booking != null && i.Booking.GuestName != null && i.Booking.GuestName.ToLower().Contains(s)) ||
                (i.Booking != null && i.Booking.BookingCode != null && i.Booking.BookingCode.ToLower().Contains(s))
            );
        }

        if (query.StartDate.HasValue)
        {
            q = q.Where(i => i.CreatedAt >= query.StartDate.Value);
        }

        if (query.EndDate.HasValue)
        {
            var nextDay = query.EndDate.Value.AddDays(1);
            q = q.Where(i => i.CreatedAt < nextDay);
        }

        if (!string.IsNullOrEmpty(query.Status) && query.Status != "All")
        {
            q = q.Where(i => i.Status == query.Status);
        }

        // Sorting
        query.SortBy = query.SortBy?.ToLower() ?? "date";
        query.SortOrder = query.SortOrder?.ToLower() ?? "desc";

        if (query.SortBy == "amount")
        {
            q = query.SortOrder == "asc" ? q.OrderBy(i => i.FinalTotal) : q.OrderByDescending(i => i.FinalTotal);
        }
        else if (query.SortBy == "id")
        {
            q = query.SortOrder == "asc" ? q.OrderBy(i => i.Id) : q.OrderByDescending(i => i.Id);
        }
        else // default to date
        {
            q = query.SortOrder == "asc" ? q.OrderBy(i => i.CreatedAt) : q.OrderByDescending(i => i.CreatedAt);
        }

        // Pagination
        var total = await q.CountAsync();
        var items = await q
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        return new PaginatedResultDto<Invoice>
        {
            Items = items,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }
}
