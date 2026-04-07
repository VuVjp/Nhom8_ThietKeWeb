using HotelManagement.Data;
using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Services.Implementations;

public class BookingService : IBookingService
{
    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Pending",
        "Confirmed",
        "CheckedIn",
        "CheckedOut",
        "Cancelled",
    };

    private readonly AppDbContext _context;

    public BookingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<RoomAvailabilityDto>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut, int? excludeBookingId = null)
    {
        ValidateDateRange(checkIn, checkOut);

        var bookedRoomIds = await _context.BookingDetails
            .AsNoTracking()
            .Include(detail => detail.Booking)
            .Where(detail => detail.RoomId.HasValue
                && detail.CheckInDate < checkOut
                && detail.CheckOutDate > checkIn
                && (!excludeBookingId.HasValue || detail.BookingId != excludeBookingId.Value)
                && detail.Booking != null
                && detail.Booking.Status != null
                && detail.Booking.Status != "Cancelled"
                && detail.Booking.Status != "CheckedOut")
            .Select(detail => detail.RoomId!.Value)
            .Distinct()
            .ToListAsync();

        var rooms = await _context.Rooms
            .AsNoTracking()
            .Include(room => room.RoomType)
            .Where(room => !bookedRoomIds.Contains(room.Id))
            .Where(room => room.RoomTypeId.HasValue && room.RoomType != null)
            .Where(room => room.Status == null || room.Status != "Maintenance")
            .OrderBy(room => room.RoomNumber)
            .Select(room => new RoomAvailabilityDto
            {
                RoomId = room.Id,
                RoomNumber = room.RoomNumber,
                RoomTypeName = room.RoomType!.Name,
                PricePerNight = room.RoomType.BasePrice,
            })
            .ToListAsync();

        return rooms;
    }

    public async Task<BookingSummaryDto> CreateBookingAsync(CreateBookingDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentException("Booking payload is required.");
        }

        if (dto.IsExistingGuest)
        {
            if (string.IsNullOrWhiteSpace(dto.GuestEmail))
            {
                throw new ArgumentException("GuestEmail is required for existing guests.");
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(dto.GuestName))
            {
                throw new ArgumentException("GuestName is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.GuestPhone))
            {
                throw new ArgumentException("GuestPhone is required.");
            }
        }

        ValidateDateRange(dto.CheckInDate, dto.CheckOutDate);

        var roomIds = dto.RoomIds?
            .Where(id => id > 0)
            .Distinct()
            .ToList() ?? new List<int>();

        if (roomIds.Count == 0)
        {
            throw new ArgumentException("At least one room is required.");
        }

        var availableRoomIds = (await GetAvailableRoomsAsync(dto.CheckInDate, dto.CheckOutDate))
            .Select(room => room.RoomId)
            .ToHashSet();

        var unavailableRoomIds = roomIds.Where(id => !availableRoomIds.Contains(id)).ToList();
        if (unavailableRoomIds.Count > 0)
        {
            throw new ConflictException($"Room(s) unavailable: {string.Join(", ", unavailableRoomIds)}");
        }

        var rooms = await _context.Rooms
            .Include(room => room.RoomType)
            .Where(room => roomIds.Contains(room.Id) && room.RoomType != null)
            .ToListAsync();

        if (rooms.Count != roomIds.Count)
        {
            throw new NotFoundException("One or more selected rooms do not exist.");
        }

        var booking = new Booking
        {
            GuestName = dto.GuestName.Trim(),
            GuestPhone = string.IsNullOrWhiteSpace(dto.GuestPhone) ? null : dto.GuestPhone.Trim(),
            GuestEmail = string.IsNullOrWhiteSpace(dto.GuestEmail) ? null : dto.GuestEmail.Trim(),
            Status = "Confirmed",
            BookingCode = GenerateBookingCode(),
            BookingDetails = rooms.Select(room => new BookingDetail
            {
                RoomId = room.Id,
                RoomTypeId = room.RoomTypeId,
                CheckInDate = dto.CheckInDate,
                CheckOutDate = dto.CheckOutDate,
                PricePerNight = room.RoomType!.BasePrice,
            }).ToList(),
        };

        await _context.Bookings.AddAsync(booking);
        await _context.SaveChangesAsync();

        return MapToSummaryDto(booking);
    }

    public async Task<BookingSummaryDto> UpdateBookingAsync(int id, UpdateBookingDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentException("Booking payload is required.");
        }

        var booking = await _context.Bookings
            .Include(item => item.BookingDetails)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (booking == null)
        {
            throw new NotFoundException($"Booking with ID {id} not found.");
        }

        if (!string.Equals(booking.Status, "Pending", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Only pending bookings can be edited.");
        }

        ValidateDateRange(dto.CheckInDate, dto.CheckOutDate);

        var roomIds = dto.RoomIds?
            .Where(roomId => roomId > 0)
            .Distinct()
            .ToList() ?? new List<int>();

        if (roomIds.Count == 0)
        {
            throw new ArgumentException("At least one room is required.");
        }

        var currentDetailIds = booking.BookingDetails.Select(detail => detail.Id).ToList();

        var bookedRoomIds = await _context.BookingDetails
            .AsNoTracking()
            .Include(detail => detail.Booking)
            .Where(detail => detail.RoomId.HasValue)
            .Where(detail => !currentDetailIds.Contains(detail.Id))
            .Where(detail => detail.CheckInDate < dto.CheckOutDate && detail.CheckOutDate > dto.CheckInDate)
            .Where(detail => detail.Booking != null
                && detail.Booking.Status != null
                && detail.Booking.Status != "Cancelled"
                && detail.Booking.Status != "CheckedOut")
            .Select(detail => detail.RoomId!.Value)
            .Distinct()
            .ToListAsync();

        var unavailableRoomIds = roomIds.Where(roomId => bookedRoomIds.Contains(roomId)).ToList();
        if (unavailableRoomIds.Count > 0)
        {
            throw new ConflictException($"Room(s) unavailable: {string.Join(", ", unavailableRoomIds)}");
        }

        var rooms = await _context.Rooms
            .Include(room => room.RoomType)
            .Where(room => roomIds.Contains(room.Id) && room.RoomTypeId.HasValue && room.RoomType != null)
            .ToListAsync();

        if (rooms.Count != roomIds.Count)
        {
            throw new NotFoundException("One or more selected rooms do not exist.");
        }

        booking.GuestName = dto.GuestName!.Trim() ?? booking.GuestName;
        booking.GuestPhone = dto.GuestPhone!.Trim() ?? booking.GuestPhone;
        booking.GuestEmail = string.IsNullOrWhiteSpace(dto.GuestEmail) ? null : dto.GuestEmail.Trim();

        _context.BookingDetails.RemoveRange(booking.BookingDetails);

        booking.BookingDetails = rooms.Select(room => new BookingDetail
        {
            RoomId = room.Id,
            RoomTypeId = room.RoomTypeId,
            CheckInDate = dto.CheckInDate,
            CheckOutDate = dto.CheckOutDate,
            PricePerNight = room.RoomType!.BasePrice,
        }).ToList();

        await _context.SaveChangesAsync();

        return MapToSummaryDto(booking);
    }

    public async Task<IEnumerable<BookingSummaryDto>> GetArrivalsTodayAsync()
    {
        var today = DateTime.Today;

        var bookings = await _context.Bookings
            .AsNoTracking()
            .Include(booking => booking.BookingDetails)
            .Where(booking => booking.BookingDetails.Any(detail => detail.CheckInDate.Date == today))
            .Where(booking => booking.Status == "Pending" || booking.Status == "Confirmed")
            .OrderBy(booking => booking.Id)
            .ToListAsync();

        return bookings.Select(MapToSummaryDto);
    }

    public async Task<IEnumerable<BookingSummaryDto>> GetInHouseGuestsAsync()
    {
        var bookings = await _context.Bookings
            .AsNoTracking()
            .Include(booking => booking.BookingDetails)
            .Where(booking => booking.Status == "CheckedIn")
            .OrderBy(booking => booking.Id)
            .ToListAsync();

        return bookings.Select(MapToSummaryDto);
    }

    public async Task<IEnumerable<BookingSummaryDto>> GetAllBookingsAsync()
    {
        var bookings = await _context.Bookings
            .AsNoTracking()
            .Include(booking => booking.BookingDetails)
            .OrderByDescending(booking => booking.Id)
            .ToListAsync();

        return bookings.Select(MapToSummaryDto);
    }

    public async Task<bool> ChangeBookingStatusAsync(int id, string status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            throw new ArgumentException("Status is required.");
        }

        if (!ValidStatuses.Contains(status))
        {
            throw new ArgumentException("Invalid booking status.");
        }

        var booking = await _context.Bookings
            .Include(item => item.BookingDetails)
                .ThenInclude(detail => detail.Room)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (booking == null)
        {
            return false;
        }
        if (string.Equals(status, "CheckedIn", StringComparison.OrdinalIgnoreCase))
        {
            var now = DateTime.Now;
            var hasFutureStay = booking.BookingDetails.Any(detail => detail.CheckInDate > now);
            if (hasFutureStay)
            {
                throw new InvalidOperationException("Cannot change status of a checked-in booking with future stay.");
            }

            if (booking.Status != "Confirmed" && booking.Status != "Pending")
            {
                throw new InvalidOperationException("Only pending or confirmed bookings can be checked in.");
            }
        }
        if (string.Equals(status, "CheckedOut", StringComparison.OrdinalIgnoreCase))
        {
            var now = DateTime.Now;
            var hasFutureStay = booking.BookingDetails.Any(detail => detail.CheckOutDate > now);
            if (hasFutureStay)
            {
                throw new InvalidOperationException("Cannot change status of a checked-out booking with future stay.");
            }
            if (booking.Status != "CheckedIn")
            {
                throw new InvalidOperationException("Only checked-in bookings can be checked out.");
            }
        }

        booking.Status = status;

        if (status.Equals("CheckedIn", StringComparison.OrdinalIgnoreCase))
        {
            foreach (var detail in booking.BookingDetails)
            {
                if (detail.Room == null)
                {
                    continue;
                }

                detail.Room.Status = "Occupied";
            }
        }
        else if (status.Equals("CheckedOut", StringComparison.OrdinalIgnoreCase))
        {
            foreach (var detail in booking.BookingDetails)
            {
                if (detail.Room == null)
                {
                    continue;
                }

                detail.Room.Status = "Cleaning";
                detail.Room.CleaningStatus = "Dirty";
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private static BookingSummaryDto MapToSummaryDto(Booking booking)
    {
        var orderedDetails = booking.BookingDetails
            .OrderBy(item => item.CheckInDate)
            .ToList();

        var firstCheckIn = orderedDetails.FirstOrDefault()?.CheckInDate ?? DateTime.MinValue;
        var lastCheckOut = orderedDetails.LastOrDefault()?.CheckOutDate ?? DateTime.MinValue;

        return new BookingSummaryDto
        {
            Id = booking.Id,
            GuestName = booking.GuestName ?? string.Empty,
            GuestPhone = booking.GuestPhone ?? string.Empty,
            GuestEmail = booking.GuestEmail,
            CheckInDate = firstCheckIn,
            CheckOutDate = lastCheckOut,
            Status = string.IsNullOrWhiteSpace(booking.Status) ? "Pending" : booking.Status,
            TotalAmount = CalculateTotalAmount(orderedDetails),
            RoomIds = orderedDetails.Where(item => item.RoomId.HasValue).Select(item => item.RoomId!.Value).Distinct().ToList(),
        };
    }

    private static decimal CalculateTotalAmount(IEnumerable<BookingDetail> details)
    {
        decimal total = 0;

        foreach (var detail in details)
        {
            var duration = detail.CheckOutDate - detail.CheckInDate;
            if (duration <= TimeSpan.Zero)
            {
                continue;
            }

            if (detail.CheckInDate.Date == detail.CheckOutDate.Date)
            {
                var hours = (decimal)Math.Ceiling(duration.TotalHours);
                var hourlyRate = Math.Ceiling(detail.PricePerNight / 24m);
                total += Math.Max(1, hours) * hourlyRate;
            }
            else
            {
                var nights = (decimal)Math.Ceiling(duration.TotalDays);
                total += Math.Max(1, nights) * detail.PricePerNight;
            }
        }

        return total;
    }

    private static void ValidateDateRange(DateTime checkIn, DateTime checkOut)
    {
        if (checkIn == default || checkOut == default)
        {
            throw new ArgumentException("Check-in and check-out dates are required.");
        }

        if (checkOut <= checkIn)
        {
            throw new ArgumentException("Check-out must be later than check-in.");
        }
    }

    private static string GenerateBookingCode()
    {
        return $"BK{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    }
}