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

	[Permission(PermissionNames.ManageRoomInventory)]
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

	[Permission(PermissionNames.ManageRoomInventory)]
	[HttpPost]
	public async Task<IActionResult> Create(CreateRoomInventoryDto inventory)
	{
		var result = await _service.AddItemAsync(inventory);
		return result ? Ok("Created item successfully.") : BadRequest("Failed to create item.");
	}

	[Permission(PermissionNames.ManageRoomInventory)]
	[HttpPut("{id}")]
	public async Task<IActionResult> Update(int id, UpdateRoomInventoryDto inventory)
	{
		var result = await _service.UpdateItemAsync(id, inventory);
		return result ? NoContent() : NotFound();
	}

	[Permission(PermissionNames.ManageRoomInventory)]
	[HttpPatch("{id}/toggle-active")]
	public async Task<IActionResult> ToggleActive(int id)
	{
		var result = await _service.ToggleActiveAsync(id);
		return result ? Ok("Room inventory active status toggled successfully.") : NotFound();
	}

	[Permission(PermissionNames.ManageRoomInventory)]
	[HttpPost("clone/{idClone}/to/{newRoomId}")]
	public async Task<IActionResult> Clone(int idClone, int newRoomId)
	{
		await _service.CloneItemAsync(idClone, newRoomId);
		return Ok("Clone item completed successfully.");
	}
}