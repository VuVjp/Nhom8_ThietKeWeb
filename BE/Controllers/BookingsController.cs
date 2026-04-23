using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _service;
    private readonly INotificationService _notificationService;

    public BookingsController(IBookingService service, INotificationService notificationService)
    {
        _service = service;
        _notificationService = notificationService;
    }

    private async Task NotifyRolesAsync(IEnumerable<RoleName> roles, CreateNotificationDto dto)
    {
        var tasks = roles.Distinct().Select(role => _notificationService.SendByRoleAsync(role, dto));
        await Task.WhenAll(tasks);
    }

    private async Task TryNotifyRolesAsync(IEnumerable<RoleName> roles, CreateNotificationDto dto)
    {
        try
        {
            await NotifyRolesAsync(roles, dto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Notification Warning] {ex.Message}");
        }
    }

    private static bool IsOperationalBookingStatus(string status)
    {
        var normalized = status.Trim().ToUpperInvariant();
        return normalized is "CHECKIN" or "CHECKEDIN" or "CHECKOUT" or "CHECKEDOUT";
    }

    [HttpGet("available-rooms")]
    public async Task<IActionResult> GetAvailableRooms([FromQuery] DateTime checkIn, [FromQuery] DateTime checkOut, [FromQuery] int? excludeBookingId)
    {
        var data = await _service.GetAvailableRoomsAsync(checkIn, checkOut, excludeBookingId);
        return Ok(data);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingDto dto)
    {
        var created = await _service.CreateBookingAsync(dto);

        await TryNotifyRolesAsync(
            new[] { RoleName.Admin, RoleName.Manager },
            new CreateNotificationDto
            {
                Title = "New booking created",
                Content = $"Booking #{created.Id} for {created.GuestName} from {created.CheckInDate:yyyy-MM-dd} to {created.CheckOutDate:yyyy-MM-dd}.",
                Type = NotificationAction.BookingCreated,
                ReferenceLink = "admin/bookings"
            });

        return Ok(created);
    }

    [HttpGet("by-email")]
    public async Task<IActionResult> GetByEmail([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest("Email is required.");
        var all = await _service.GetAllBookingsAsync();
        var filtered = all.Where(b => string.Equals(b.GuestEmail, email, StringComparison.OrdinalIgnoreCase));
        return Ok(filtered);
    }

    [HttpPut("{id}")]
    [Permission(PermissionNames.ManageBookings)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBookingDto dto)
    {
        var updated = await _service.UpdateBookingAsync(id, dto);

        await TryNotifyRolesAsync(
            new[] { RoleName.Admin, RoleName.Manager },
            new CreateNotificationDto
            {
                Title = "Booking updated",
                Content = $"Booking #{updated.Id} was updated for {updated.GuestName}.",
                Type = NotificationAction.BookingUpdated,
                ReferenceLink = $"admin/bookings/{updated.Id}"
            });

        return Ok(updated);
    }

    [HttpGet("arrivals")]
    [Permission(PermissionNames.ManageBookings)]
    public async Task<IActionResult> GetArrivalsToday()
    {
        return Ok(await _service.GetArrivalsTodayAsync());
    }

    [HttpGet("in-house")]
    [Permission(PermissionNames.ManageBookings)]
    public async Task<IActionResult> GetInHouseGuests()
    {
        return Ok(await _service.GetInHouseGuestsAsync());
    }

    [HttpGet("active-rooms")]
    [Permission(PermissionNames.ManageServices)]
    public async Task<IActionResult> GetActiveRooms()
    {
        return Ok(await _service.GetActiveRoomsAsync());
    }

    [HttpGet]
    [Permission(PermissionNames.ManageBookings)]
    public async Task<IActionResult> GetAllBookings()
    {
        return Ok(await _service.GetAllBookingsAsync());
    }

    [HttpPatch("{id}/status")]
    [Permission(PermissionNames.ManageBookings)]
    public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeBookingStatusDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Status))
        {
            return BadRequest(new { message = "Status is required." });
        }

        try
        {
            var ok = await _service.ChangeBookingStatusAsync(id, dto.Status);
            if (!ok)
            {
                return NotFound();
            }

            var rolesToNotify = new List<RoleName> { RoleName.Admin, RoleName.Manager, RoleName.Receptionist };
            if (IsOperationalBookingStatus(dto.Status))
            {
                rolesToNotify.Add(RoleName.Housekeeping);
            }

            await TryNotifyRolesAsync(
                rolesToNotify,
                new CreateNotificationDto
                {
                    Title = "Booking status changed",
                    Content = $"Booking #{id} status changed to {dto.Status}.",
                    Type = NotificationAction.BookingStatusChanged,
                    ReferenceLink = $"admin/bookings/{id}"
                });

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("my-history")]
    public async Task<IActionResult> GetMyHistory()
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var history = await _service.GetBookingsByUserIdAsync(userId);
        return Ok(history);
    }

    [Authorize]
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelMyBooking(int id)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var ok = await _service.CancelBookingByUserAsync(id, userId);
        if (!ok)
        {
            return BadRequest(new { message = "Cannot cancel this booking. It might not belong to you or it's in a state that cannot be cancelled." });
        }

        return Ok(new { message = "Booking cancelled successfully." });
    }
}