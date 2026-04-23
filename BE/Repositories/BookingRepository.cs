using HotelManagement.Data;
using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Repositories.Implementations;

public class BookingRepository : IBookingRepository
{
    private readonly AppDbContext _context;

    public BookingRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<int>> GetBookedRoomIdsAsync(
        DateTime checkIn,
        DateTime checkOut,
        int? excludeBookingId = null,
        IEnumerable<int>? excludeDetailIds = null)
    {
        var excludedSet = excludeDetailIds?.ToHashSet() ?? new HashSet<int>();

        return await _context.BookingDetails
            .AsNoTracking()
            .Include(detail => detail.Booking)
            .Where(detail => detail.RoomId.HasValue)
            .Where(detail => detail.CheckInDate < checkOut && detail.CheckOutDate > checkIn)
            .Where(detail => !excludeBookingId.HasValue || detail.BookingId != excludeBookingId.Value)
            .Where(detail => !excludedSet.Contains(detail.Id))
            .Where(detail => detail.Booking != null
                && detail.Booking.Status != null
                && detail.Booking.Status != "Cancelled"
                && detail.Booking.Status != "CheckedOut")
            .Select(detail => detail.RoomId!.Value)
            .Distinct()
            .ToListAsync();
    }

    public async Task<List<Room>> GetRoomsWithRoomTypeByIdsAsync(IEnumerable<int> roomIds)
    {
        var ids = roomIds.Distinct().ToList();

        return await _context.Rooms
            .Include(room => room.RoomType)
            .Where(room => ids.Contains(room.Id) && room.RoomType != null)
            .ToListAsync();
    }

    public async Task<List<Room>> GetAllRoomsWithRoomTypeAsync()
    {
        return await _context.Rooms
            .AsNoTracking()
            .Include(room => room.RoomType)
            .Where(room => room.RoomTypeId.HasValue && room.RoomType != null)
            .ToListAsync();
    }

    public async Task AddBookingAsync(Booking booking)
    {
        await _context.Bookings.AddAsync(booking);
    }

    public void RemoveBookingDetails(IEnumerable<BookingDetail> bookingDetails)
    {
        _context.BookingDetails.RemoveRange(bookingDetails);
    }

    public async Task<Booking?> GetBookingByIdWithDetailsAsync(int id, bool includeRoom = false)
    {
        IQueryable<Booking> query = _context.Bookings
             .Include(item => item.User)
                 .ThenInclude(u => u!.Membership)
            .Include(item => item.BookingDetails)
                .ThenInclude(detail => detail.OrderServices)
                    .ThenInclude(os => os.OrderServiceDetails)
                        .ThenInclude(osd => osd.Service)
            .Include(item => item.BookingDetails)
                .ThenInclude(detail => detail.LossAndDamages)
                    .ThenInclude(ld => ld.RoomInventory);

        if (includeRoom)
        {
            query = query
                .Include(item => item.BookingDetails)
                .ThenInclude(detail => detail.Room);
        }

        return await query.FirstOrDefaultAsync(item => item.Id == id);
    }

    public async Task<List<Booking>> GetArrivalsTodayAsync(DateTime date)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(booking => booking.BookingDetails)
                .ThenInclude(detail => detail.Room)
            .Where(booking => booking.BookingDetails.Any(detail => detail.CheckInDate.Date == date.Date))
            .Where(booking => booking.Status == "Pending" || booking.Status == "Confirmed")
            .OrderBy(booking => booking.Id)
            .ToListAsync();
    }

    public async Task<List<Booking>> GetInHouseGuestsAsync()
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(booking => booking.BookingDetails)
                .ThenInclude(detail => detail.Room)
            .Where(booking => booking.Status == "CheckedIn")
            .OrderBy(booking => booking.Id)
            .ToListAsync();
    }

    public async Task<List<Booking>> GetAllWithDetailsAsync()
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(booking => booking.BookingDetails)
                .ThenInclude(detail => detail.Room)
            .OrderByDescending(booking => booking.Id)
            .ToListAsync();
    }
    public async Task<List<Booking>> GetByUserIdAsync(int userId)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(booking => booking.BookingDetails)
                .ThenInclude(detail => detail.Room)
            .Where(booking => booking.UserId == userId)
            .OrderByDescending(booking => booking.Id)
            .ToListAsync();
    }

    public async Task<OverdueBookingResult> GetOverdueCheckInBookingIdsAsync(
    DateTime cutoffTimeConfirmed,
    DateTime cutoffTimePending)
    {
        var data = await _context.Bookings
            .AsNoTracking()
            .Where(b =>
                (b.Status == "Pending" && b.CreatedAt <= cutoffTimePending)
                ||
                (b.Status == "Confirmed" &&
                    b.BookingDetails.Any(d => d.CheckInDate <= cutoffTimeConfirmed))
            )
            .Select(b => new
            {
                b.Id,
                b.Status
            })
            .ToListAsync();

        return new OverdueBookingResult
        {
            PendingBookingIds = data
                .Where(x => x.Status == "Pending")
                .Select(x => x.Id)
                .ToList(),

            ConfirmedBookingIds = data
                .Where(x => x.Status == "Confirmed")
                .Select(x => x.Id)
                .ToList()
        };
    }


    public async Task<BookingDetail?> GetBookingDetailWithBookingAsync(int id)
    {
        return await _context.BookingDetails
            .Include(bd => bd.Booking)
            .FirstOrDefaultAsync(bd => bd.Id == id);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}