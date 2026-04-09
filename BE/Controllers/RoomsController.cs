using HotelManagement.Entities;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;
using HotelManagement.Dtos;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
	private readonly IRoomService _service;

	public RoomsController(IRoomService service) => _service = service;


	[HttpGet]
	public async Task<IActionResult> GetAll() => Ok(await _service.GetListAsync());

	[Permission(PermissionNames.UpdateCleaning)]
	[HttpGet("status/{status}")]
	public async Task<IActionResult> GetByStatus(string status, [FromQuery] bool includeCleaningRequested = false)
	{
		if (string.IsNullOrWhiteSpace(status))
		{
			return BadRequest("Status is required.");
		}

		return Ok(await _service.GetByStatusAsync(status, includeCleaningRequested));
	}

	[Permission(PermissionNames.UpdateCleaning)]
	[HttpPatch("{id}/request-cleaning")]
	public async Task<IActionResult> ToggleCleaningRequest(int id, [FromBody] bool requested)
	{
		await _service.ChangeCleaningRequestedAsync(id, requested);
		return Ok("Cleaning request updated successfully.");
	}

	[Permission(PermissionNames.UpdateCleaning)]
	[HttpPatch("{id}/complete-cleaning")]
	public async Task<IActionResult> CompleteCleaningRequest(int id)
	{
		try
		{
			await _service.ChangeCleaningRequestedAsync(id, false);
			return Ok("Room status updated to Available.");
		}
		catch (NotFoundException ex)
		{
			return NotFound(ex.Message);
		}
	}

	[Permission(PermissionNames.UpdateCleaning)]
	[HttpGet("cleaning-status/{cleaningStatus}")]
	public async Task<IActionResult> GetByCleaningStatus(string cleaningStatus)
	{
		if (string.IsNullOrWhiteSpace(cleaningStatus))
		{
			return BadRequest("Cleaning status is required.");
		}

		return Ok(await _service.GetByCleaningStatusAsync(cleaningStatus));
	}

	[HttpGet("{id}")]
	public async Task<IActionResult> GetById(int id)
	{
		var room = await _service.GetDetailAsync(id);
		return room == null ? NotFound("Room not found.") : Ok(room);
	}

	[Permission(PermissionNames.ManageRooms)]
	[HttpPost]
	public async Task<IActionResult> Create([FromBody] RoomDto room)
	{
		try
		{
			var result = await _service.CreateRoomAsync(room);
			return result ? CreatedAtAction(nameof(GetById), new { id = room.RoomNumber }, room) : BadRequest();
		}
		catch (ArgumentException ex)
		{
			return BadRequest(ex.Message);
		}
		catch (NotFoundException ex)
		{
			return NotFound(ex.Message);
		}
	}

	[Permission(PermissionNames.ManageRooms)]
	[HttpPost("bulk-create")]
	public async Task<IActionResult> BulkCreate([FromBody] IEnumerable<RoomDto> rooms)
	{
		try
		{
			var createdCount = await _service.CreateRoomsBulkAsync(rooms);
			return Ok(new
			{
				message = $"Created {createdCount} rooms successfully.",
				createdCount
			});
		}
		catch (ArgumentException ex)
		{
			return BadRequest(ex.Message);
		}
		catch (NotFoundException ex)
		{
			return NotFound(ex.Message);
		}
	}

	[Permission(PermissionNames.UpdateCleaning)]
	[HttpPatch("{id}/status")]
	public async Task<IActionResult> ChangeStatus(int id, [FromBody] string newStatus)
	{
		try
		{
			await _service.ChangeRoomStatusAsync(id, newStatus);
			return Ok("Room status updated successfully.");
		}
		catch (NotFoundException ex)
		{
			return NotFound(ex.Message);
		}
	}

	[Permission(PermissionNames.UpdateCleaning)]
	[HttpPatch("{id}/cleaning-status")]
	public async Task<IActionResult> ChangeCleaningStatus(int id, [FromBody] string newCleaningStatus)
	{
		try
		{
			await _service.ChangeRoomCleaningStatusAsync(id, newCleaningStatus);
			return Ok("Room cleaning status updated successfully.");
		}
		catch (NotFoundException ex)
		{
			return NotFound(ex.Message);
		}
	}

	[Permission(PermissionNames.ManageRooms)]
	[HttpPut("{id}")]
	public async Task<IActionResult> Update(int id, [FromBody] RoomDto room)
	{
		try
		{
			var result = await _service.UpdateRoomAsync(id, room);
			return result ? NoContent() : NotFound();
		}
		catch (ArgumentException ex)
		{
			return BadRequest(ex.Message);
		}
	}

	[Permission(PermissionNames.ManageRooms)]
	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(int id)
	{
		var result = await _service.DeleteRoomAsync(id);
		return result ? Ok("Room deleted successfully.") : NotFound();
	}
}