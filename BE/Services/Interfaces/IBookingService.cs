using HotelManagement.Dtos;

namespace HotelManagement.Services.Interfaces;

public interface IBookingService
{
    Task<IEnumerable<RoomAvailabilityDto>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut, int? excludeBookingId = null);
    Task<BookingSummaryDto> CreateBookingAsync(CreateBookingDto dto);
    Task<BookingSummaryDto> UpdateBookingAsync(int id, UpdateBookingDto dto);
    Task<IEnumerable<BookingSummaryDto>> GetArrivalsTodayAsync();
    Task<IEnumerable<BookingSummaryDto>> GetInHouseGuestsAsync();
    Task<IEnumerable<BookingSummaryDto>> GetAllBookingsAsync();
    Task<bool> ChangeBookingStatusAsync(int id, string status);
}