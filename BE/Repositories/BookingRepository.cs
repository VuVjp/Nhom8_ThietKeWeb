using HotelManagement.Data;
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
            .Include(item => item.BookingDetails);

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
            .Where(booking => booking.Status == "CheckedIn")
            .OrderBy(booking => booking.Id)
            .ToListAsync();
    }

    public async Task<List<Booking>> GetAllWithDetailsAsync()
{
    return await _context.Bookings
        .AsNoTracking()
        .Include(booking => booking.BookingDetails)
        .OrderByDescending(booking => booking.Id)
        .ToListAsync();
}

    public async Task<List<int>> GetOverdueCheckInBookingIdsAsync(DateTime cutoffTime)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Where(booking => booking.Status == "Pending" || booking.Status == "Confirmed")
            .Where(booking => booking.BookingDetails.Any(detail => detail.CheckInDate <= cutoffTime))
            .Select(booking => booking.Id)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}