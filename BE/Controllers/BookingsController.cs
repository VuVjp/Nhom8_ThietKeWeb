using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _service;

    public BookingsController(IBookingService service)
    {
        _service = service;
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
}