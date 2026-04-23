using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;

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

    private readonly IBookingRepository _repository;
    private readonly IUserRepository _userRepository;
    private readonly IVoucherRepository _voucherRepository;
    private readonly IVoucherService _voucherService;
    private readonly IInvoiceService _invoiceService;

    public BookingService(IBookingRepository repository, IUserRepository userRepository, IVoucherRepository voucherRepository, IVoucherService voucherService, IInvoiceService invoiceService)
    {
        _repository = repository;
        _userRepository = userRepository;
        _voucherRepository = voucherRepository;
        _voucherService = voucherService;
        _invoiceService = invoiceService;
    }

    public async Task<IEnumerable<RoomAvailabilityDto>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut, int? excludeBookingId = null)
    {
        ValidateDateRange(checkIn, checkOut);

        var bookedRoomIds = await _repository.GetBookedRoomIdsAsync(checkIn, checkOut, excludeBookingId);

        var rooms = (await _repository.GetAllRoomsWithRoomTypeAsync())
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
            .ToList();

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

        var rooms = await _repository.GetRoomsWithRoomTypeByIdsAsync(roomIds);

        if (rooms.Count != roomIds.Count)
        {
            throw new NotFoundException("One or more selected rooms do not exist.");
        }

        var booking = new Booking
        {
            GuestName = dto.GuestName.Trim(),
            GuestPhone = string.IsNullOrWhiteSpace(dto.GuestPhone) ? null : dto.GuestPhone.Trim(),
            GuestEmail = string.IsNullOrWhiteSpace(dto.GuestEmail) ? null : dto.GuestEmail.Trim(),
            Status = "Pending",
            BookingCode = GenerateBookingCode(),
            BookingDetails = rooms.Select(room => new BookingDetail
            {
                RoomId = room.Id,
                RoomTypeId = room.RoomTypeId,
                CheckInDate = dto.CheckInDate,
                CheckOutDate = dto.CheckOutDate,
                PricePerNight = room.RoomType!.BasePrice,
            }).ToList(),
            InvoiceType = dto.InvoiceType ?? "Consolidated"
        };

        var registeredUser = await ResolveRegisteredUserAsync(dto.GuestEmail, dto.IsExistingGuest);
        if (registeredUser != null)
        {
            booking.UserId = registeredUser.Id;
            booking.GuestName = string.IsNullOrWhiteSpace(booking.GuestName) ? registeredUser.FullName : booking.GuestName;
            booking.GuestPhone = string.IsNullOrWhiteSpace(booking.GuestPhone) ? registeredUser.Phone : booking.GuestPhone;
            booking.GuestEmail = registeredUser.Email;
        }

        booking.TotalPrice = CalculateTotalAmount(booking.BookingDetails);
        var membershipDiscountAmount = CalculateMembershipDiscountForBooking(registeredUser, booking.TotalPrice);

        if (membershipDiscountAmount > 0)
        {
            booking.AppliedMembershipId = registeredUser!.MembershipId;
            booking.AppliedMembershipTierName = registeredUser.Membership?.TierName;
            booking.MembershipDiscountPercentApplied = registeredUser.Membership?.DiscountPercent;
            booking.MembershipDiscountAmountApplied = membershipDiscountAmount;
        }

        if (!string.IsNullOrWhiteSpace(dto.VoucherId))
        {
            booking.VoucherId = int.TryParse(dto.VoucherId, out var voucherId) ? voucherId : (int?)null;
            var voucher = await _voucherRepository.GetByIdAsync(booking.VoucherId!.Value);
            if (voucher != null)
            {
                await _voucherService.ValidateCodeAsync(voucher.Code, booking.TotalPrice);
                decimal voucherDiscountAmount = 0m;
                if (voucher.DiscountType == "Percentage")
                {
                    voucherDiscountAmount = Math.Round(booking.TotalPrice * (voucher.DiscountValue / 100m), 2);
                }
                else if (voucher.DiscountType == "Fixed")
                {
                    voucherDiscountAmount = Math.Min(voucher.DiscountValue, booking.TotalPrice);
                }

                booking.VoucherDiscount = voucherDiscountAmount;
                voucher.UsageCount += 1;
                await _voucherRepository.SaveChangesAsync();
            }
        }
        booking.FinalPrice = Math.Max(0m, booking.TotalPrice - (booking.MembershipDiscountAmountApplied ?? 0m) - (booking.VoucherDiscount ?? 0m));
        booking.Deposit = Math.Round(booking.FinalPrice * 0.3m, 0);

        await _repository.AddBookingAsync(booking);
        await _repository.SaveChangesAsync();

        return MapToSummaryDto(booking);
    }

    public async Task<BookingSummaryDto> UpdateBookingAsync(int id, UpdateBookingDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentException("Booking payload is required.");
        }

        var booking = await _repository.GetBookingByIdWithDetailsAsync(id);

        if (booking == null)
        {
            throw new NotFoundException($"Booking with ID {id} not found.");
        }

        if (string.IsNullOrWhiteSpace(dto.GuestName) && string.IsNullOrWhiteSpace(dto.GuestPhone) && string.IsNullOrWhiteSpace(dto.GuestEmail) && (dto.RoomIds == null || dto.RoomIds.Count == 0))
        {
            throw new ArgumentException("At least one field must be provided for update.");
        }

        if (dto.RoomIds == null || dto.RoomIds.Count == 0)
        {
            if (string.IsNullOrWhiteSpace(dto.GuestName) && string.IsNullOrWhiteSpace(dto.GuestPhone) && string.IsNullOrWhiteSpace(dto.GuestEmail))
            {
                throw new ArgumentException("At least one field must be provided for update.");
            }
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

        var bookedRoomIds = await _repository.GetBookedRoomIdsAsync(dto.CheckInDate, dto.CheckOutDate, null, currentDetailIds);

        var unavailableRoomIds = roomIds.Where(roomId => bookedRoomIds.Contains(roomId)).ToList();
        if (unavailableRoomIds.Count > 0)
        {
            throw new ConflictException($"Room(s) unavailable: {string.Join(", ", unavailableRoomIds)}");
        }

        var rooms = await _repository.GetRoomsWithRoomTypeByIdsAsync(roomIds);

        if (rooms.Count != roomIds.Count)
        {
            throw new NotFoundException("One or more selected rooms do not exist.");
        }

        booking.GuestName = dto.GuestName!.Trim() ?? booking.GuestName;
        booking.GuestPhone = dto.GuestPhone!.Trim() ?? booking.GuestPhone;
        booking.GuestEmail = string.IsNullOrWhiteSpace(dto.GuestEmail) ? null : dto.GuestEmail.Trim();
        booking.InvoiceType = dto.InvoiceType ?? booking.InvoiceType;

        _repository.RemoveBookingDetails(booking.BookingDetails);

        booking.BookingDetails = rooms.Select(room => new BookingDetail
        {
            RoomId = room.Id,
            RoomTypeId = room.RoomTypeId,
            CheckInDate = dto.CheckInDate,
            CheckOutDate = dto.CheckOutDate,
            PricePerNight = room.RoomType!.BasePrice,
        }).ToList();

        booking.TotalPrice = CalculateTotalAmount(booking.BookingDetails);
        var membershipDiscountAmount = CalculateMembershipDiscountForBooking(booking.User, booking.TotalPrice);
        booking.MembershipDiscountAmountApplied = membershipDiscountAmount;

        if (booking.VoucherId.HasValue)
        {
            var voucher = await _voucherRepository.GetByIdAsync(booking.VoucherId.Value);
            if (voucher != null)
            {
                await _voucherService.ValidateCodeAsync(voucher.Code, booking.TotalPrice);
                decimal voucherDiscountAmount = 0m;
                if (voucher.DiscountType == "Percentage")
                {
                    voucherDiscountAmount = Math.Round(booking.TotalPrice * (voucher.DiscountValue / 100m), 0);
                }
                else if (voucher.DiscountType == "Fixed")
                {
                    voucherDiscountAmount = Math.Min(voucher.DiscountValue, booking.TotalPrice);
                }

                booking.VoucherDiscount = voucherDiscountAmount;
            }
        }
        booking.FinalPrice = Math.Max(0m, booking.TotalPrice - (booking.MembershipDiscountAmountApplied ?? 0m) - (booking.VoucherDiscount ?? 0m));
        booking.Deposit = Math.Round(booking.FinalPrice * 0.3m, 0);

        await _repository.SaveChangesAsync();

        return MapToSummaryDto(booking);
    }

    public async Task<IEnumerable<BookingSummaryDto>> GetArrivalsTodayAsync()
    {
        var today = DateTime.Today;

        var bookings = await _repository.GetArrivalsTodayAsync(today);

        return bookings.Select(MapToSummaryDto);
    }

    public async Task<IEnumerable<BookingSummaryDto>> GetInHouseGuestsAsync()
    {
        var bookings = await _repository.GetInHouseGuestsAsync();

        return bookings.Select(MapToSummaryDto);
    }

    public async Task<IEnumerable<BookingSummaryDto>> GetAllBookingsAsync()
    {
        var bookings = await _repository.GetAllWithDetailsAsync();

        return bookings.Select(MapToSummaryDto);
    }

    public async Task<IEnumerable<BookingSummaryDto>> GetBookingsByUserIdAsync(int userId)
    {
        var bookings = await _repository.GetByUserIdAsync(userId);

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

        var booking = await _repository.GetBookingByIdWithDetailsAsync(id, includeRoom: true);

        if (booking == null)
        {
            return false;
        }
        if (string.Equals(status, "CheckedIn", StringComparison.OrdinalIgnoreCase))
        {
            var maintenanceRooms = booking.BookingDetails
                .Where(detail => detail.Room != null && detail.Room.Status == "Maintenance")
                .Select(detail => detail.Room!.RoomNumber)
                .ToList();
            if (maintenanceRooms.Count > 0)
            {
                throw new InvalidOperationException($"Cannot check in booking because the following rooms are under maintenance: {string.Join(", ", maintenanceRooms)}");
            }
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
            var hasFutureStay = booking.BookingDetails.Any(detail => detail.CheckInDate > now);
            if (hasFutureStay)
            {
                throw new InvalidOperationException("Cannot change status of a checked-out booking with future stay.");
            }
            if (booking.Status != "CheckedIn")
            {
                throw new InvalidOperationException("Only checked-in bookings can be checked out.");
            }
        }

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

                detail.Room.Status = "InsClean";
                detail.Room.CleaningStatus = "Inspecting";
                detail.ActualCheckOutDate = DateTime.Now;
            }
        }
        else if (status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            if (booking.Status != "Confirmed" && booking.Status != "Pending")
            {
                throw new InvalidOperationException($"Only pending or confirmed bookings can be cancelled.");
            }
            foreach (var detail in booking.BookingDetails)
            {
                if (detail.Room == null)
                {
                    continue;
                }

                detail.Room.Status = "Available";
                detail.Room.CleaningStatus = "Clean";
            }
            if (booking.VoucherId.HasValue)
            {
                var voucher = await _voucherRepository.GetByIdAsync(booking.VoucherId.Value);
                if (voucher != null && voucher.UsageCount > 0)
                {
                    voucher.UsageCount -= 1;
                    await _voucherRepository.SaveChangesAsync();
                }
            }
        }

        booking.Status = status;
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CancelBookingByUserAsync(int bookingId, int userId)
    {
        var booking = await _repository.GetBookingByIdWithDetailsAsync(bookingId, includeRoom: false);
        if (booking == null) return false;

        if (booking.UserId != userId) return false;

        try
        {
            return await ChangeBookingStatusAsync(bookingId, "Cancelled");
        }
        catch
        {
            return false;
        }
    }

    public async Task<IEnumerable<ActiveRoomDto>> GetActiveRoomsAsync()
    {
        var bookings = await _repository.GetInHouseGuestsAsync();

        var result = new List<ActiveRoomDto>();
        foreach (var b in bookings)
        {
            foreach (var detail in b.BookingDetails)
            {
                if (detail.Room != null)
                {
                    result.Add(new ActiveRoomDto
                    {
                        BookingDetailId = detail.Id,
                        RoomNumber = detail.Room.RoomNumber,
                        GuestName = b.GuestName ?? "Unknown",
                        BookingId = b.Id
                    });
                }
            }
        }

        return result;
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
            TotalAmount = booking.FinalPrice,
            Deposit = booking.Deposit ?? 0m,
            MembershipDiscount = booking.MembershipDiscountAmountApplied ?? 0m,
            VoucherDiscount = booking.VoucherDiscount ?? 0m,
            RoomNumbers = orderedDetails.Where(item => item.RoomId.HasValue).Select(item => item.Room?.RoomNumber ?? string.Empty).Distinct().ToList(),
            RoomIds = orderedDetails
                .Select(item => item.RoomId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList(),
            CreatedAt = booking.CreatedAt,
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

    private async Task<User?> ResolveRegisteredUserAsync(string? guestEmail, bool isExistingGuest)
    {
        if (string.IsNullOrWhiteSpace(guestEmail) || !isExistingGuest)
        {
            return null;
        }

        var user = await _userRepository.GetByEmailAsync(guestEmail.Trim());
        if (isExistingGuest && user == null)
        {
            throw new NotFoundException("Existing guest account was not found.");
        }

        return user;
    }

    private static decimal CalculateMembershipDiscountForBooking(User? user, decimal totalRoomAmount)
    {
        if (user?.Membership == null || user.MembershipId == null)
        {
            return 0m;
        }

        var discountPercent = user.Membership.DiscountPercent ?? 0m;
        if (discountPercent <= 0)
        {
            return 0m;
        }

        return Math.Round(totalRoomAmount * (discountPercent / 100m), 0);
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