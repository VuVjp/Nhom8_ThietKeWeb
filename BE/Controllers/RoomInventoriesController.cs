using HotelManagement.Entities;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomInventoriesController : ControllerBase
{
	private readonly IRoomInventoryService _service;

	public RoomInventoriesController(IRoomInventoryService service)
	{
		_service = service;
	}

	[Permission("get_all_room_inventory")]
	[HttpGet]
	public async Task<IActionResult> GetAll() => Ok(await _service.GetInventoriesAsync());


	[HttpGet("room/{roomId}")]
	public async Task<IActionResult> GetByRoom(int roomId) => Ok(await _service.GetByRoomAsync(roomId));

	[HttpGet("{id}")]
	public async Task<IActionResult> GetById(int id)
	{
		var item = await _service.GetByIdAsync(id);
		return item == null ? NotFound() : Ok(item);
	}

	[Permission("create_room_inventory")]
	[HttpPost]
	public async Task<IActionResult> Create(RoomInventory inventory)
	{
		try
		{
			var result = await _service.AddItemAsync(inventory);
			return result ? CreatedAtAction(nameof(GetById), new { id = inventory.Id }, inventory) : BadRequest();
		}
		catch (ArgumentException ex)
		{
			return BadRequest(ex.Message);
		}
	}

	[Permission("update_room_inventory")]
	[HttpPut("{id}")]
	public async Task<IActionResult> Update(int id, RoomInventory inventory)
	{
		var result = await _service.UpdateItemAsync(id, inventory);
		return result ? NoContent() : NotFound();
	}

	[Permission("delete_room_inventory")]
	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(int id)
	{
		var result = await _service.RemoveItemAsync(id);
		return result ? Ok("Xóa vật tư thành công") : NotFound();
	}
}