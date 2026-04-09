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
    [Permission(PermissionNames.ManageBookings)]
    public async Task<IActionResult> Create([FromBody] CreateBookingDto dto)
    {
        var created = await _service.CreateBookingAsync(dto);
        return Ok(created);
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
    public async Task<IActionResult> ChangeStatus(int id, [FromBody] string status)
    {
        var ok = await _service.ChangeBookingStatusAsync(id, status);
        if (!ok)
        {
            return NotFound();
        }

        return NoContent();
    }
}