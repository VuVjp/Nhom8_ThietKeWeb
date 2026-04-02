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

	[Permission(PermissionNames.GetAllRoomInventory)]
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

	[Permission(PermissionNames.CreateRoomInventory)]
	[HttpPost]
	public async Task<IActionResult> Create(CreateRoomInventoryDto inventory)
	{
		var result = await _service.AddItemAsync(inventory);
		return result ? Ok("Created item successfully.") : BadRequest("Failed to create item.");
	}

	[Permission(PermissionNames.UpdateRoomInventory)]
	[HttpPut("{id}")]
	public async Task<IActionResult> Update(int id, UpdateRoomInventoryDto inventory)
	{
		var result = await _service.UpdateItemAsync(id, inventory);
		return result ? NoContent() : NotFound();
	}

	[Permission(PermissionNames.DeleteRoomInventory)]
	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(int id)
	{
		var result = await _service.RemoveItemAsync(id);
		return result ? Ok("Deleted item successfully.") : NotFound();
	}

	[Permission(PermissionNames.CreateRoomInventory)]
	[HttpPost("clone/{idClone}/to/{newRoomId}")]
	public async Task<IActionResult> Clone(int idClone, int newRoomId)
	{
		await _service.CloneItemAsync(idClone, newRoomId);
		return Ok("Clone item completed successfully.");
	}
}