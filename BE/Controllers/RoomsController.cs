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

	[HttpGet("status/{status}")]
	public async Task<IActionResult> GetByStatus(string status)
	{
		if (string.IsNullOrWhiteSpace(status))
		{
			return BadRequest("Status is required.");
		}

		return Ok(await _service.GetByStatusAsync(status));
	}

	[HttpGet("{id}")]
	public async Task<IActionResult> GetById(int id)
	{
		var room = await _service.GetDetailAsync(id);
		return room == null ? NotFound("Room not found.") : Ok(room);
	}

	[Permission(PermissionNames.CreateRoom)]
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
	}

	[Permission(PermissionNames.ChangeRoomStatus)]
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

	[Permission(PermissionNames.ChangeRoomCleaningStatus)]
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

	[Permission(PermissionNames.UpdateRoom)]
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

	[Permission(PermissionNames.DeleteRoom)]
	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(int id)
	{
		var result = await _service.DeleteRoomAsync(id);
		return result ? Ok("Room deleted successfully.") : NotFound();
	}
}