using HotelManagement.Entities;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
	private readonly IRoomService _service;

	public RoomsController(IRoomService service) => _service = service;

	[HttpGet]
	public async Task<IActionResult> GetAll() => Ok(await _service.GetListAsync());

	[HttpGet("{id}")]
	public async Task<IActionResult> GetById(int id)
	{
		var room = await _service.GetDetailAsync(id);
		return room == null ? NotFound("Không tìm thấy phòng.") : Ok(room);
	}

	[HttpPost]
	public async Task<IActionResult> Create([FromBody] Room room)
	{
		try
		{
			var result = await _service.CreateRoomAsync(room);
			return result ? CreatedAtAction(nameof(GetById), new { id = room.Id }, room) : BadRequest();
		}
		catch (ArgumentException ex)
		{
			return BadRequest(ex.Message);
		}
	}

	[HttpPut("{id}")]
	public async Task<IActionResult> Update(int id, [FromBody] Room room)
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

	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(int id)
	{
		var result = await _service.DeleteRoomAsync(id);
		return result ? Ok("Đã xóa phòng thành công.") : NotFound();
	}
}