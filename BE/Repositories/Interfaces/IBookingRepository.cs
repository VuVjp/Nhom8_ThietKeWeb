using HotelManagement.Dtos;
using HotelManagement.Entities;

namespace HotelManagement.Repositories.Interfaces;

public interface IBookingRepository
{
    Task<List<int>> GetBookedRoomIdsAsync(
        DateTime checkIn,
        DateTime checkOut,
        int? excludeBookingId = null,
        IEnumerable<int>? excludeDetailIds = null);

    Task<List<Room>> GetRoomsWithRoomTypeByIdsAsync(IEnumerable<int> roomIds);
    Task<List<Room>> GetAllRoomsWithRoomTypeAsync();
    Task AddBookingAsync(Booking booking);
    void RemoveBookingDetails(IEnumerable<BookingDetail> bookingDetails);
    Task<Booking?> GetBookingByIdWithDetailsAsync(int id, bool includeRoom = false);
    Task<List<Booking>> GetArrivalsTodayAsync(DateTime date);
    Task<List<Booking>> GetInHouseGuestsAsync();
    Task<List<Booking>> GetAllWithDetailsAsync();
    Task<OverdueBookingResult> GetOverdueCheckInBookingIdsAsync(DateTime cutoffTimeConfirmed, DateTime cutoffTimePending);
    Task<BookingDetail?> GetBookingDetailWithBookingAsync(int id);
    Task SaveChangesAsync();
}