using HotelManagement.Dtos;
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
	private readonly INotificationService _notificationService;

	public RoomInventoriesController(IRoomInventoryService service, INotificationService notificationService)
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

	private static IEnumerable<RoleName> GetRoles()
	{
		return new[] { RoleName.Admin, RoleName.Manager, RoleName.Maintenance };
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
		if (result)
		{
			await TryNotifyRolesAsync(
				GetRoles(),
				new CreateNotificationDto
				{
					Title = "Room inventory item created",
					Content = $"Item {inventory.ItemName} was added to room inventory.",
					Type = NotificationAction.RoomInventoryCreated,
					ReferenceLink = "admin/room-inventories"
				});
		}
		return result ? Ok("Created item successfully.") : BadRequest("Failed to create item.");
	}

	[Permission(PermissionNames.ManageRoomInventory)]
	[HttpPut("{id}")]
	public async Task<IActionResult> Update(int id, UpdateRoomInventoryDto inventory)
	{
		var result = await _service.UpdateItemAsync(id, inventory);
		if (result)
		{
			await TryNotifyRolesAsync(
				GetRoles(),
				new CreateNotificationDto
				{
					Title = "Room inventory item updated",
					Content = $"Item #{id} was updated.",
					Type = NotificationAction.RoomInventoryUpdated,
					ReferenceLink = $"admin/room-inventories/{id}"
				});
		}
		return result ? NoContent() : NotFound();
	}

	[Permission(PermissionNames.ManageRoomInventory)]
	[HttpPatch("{id}/toggle-active")]
	public async Task<IActionResult> ToggleActive(int id)
	{
		var result = await _service.ToggleActiveAsync(id);
		if (result)
		{
			var item = await _service.GetByIdAsync(id);
			var isActive = item?.IsActive ?? true;

			await TryNotifyRolesAsync(
				GetRoles(),
				new CreateNotificationDto
				{
					Title = isActive ? "Room inventory item activated" : "Room inventory item deactivated",
					Content = $"Item #{id} is now {(isActive ? "active" : "inactive")}.",
					Type = NotificationAction.RoomInventoryActivated,
					ReferenceLink = $"admin/room-inventories/{id}"
				});
		}
		return result ? Ok("Room inventory active status toggled successfully.") : NotFound();
	}

	[Permission(PermissionNames.ManageRoomInventory)]
	[HttpPost("clone/{idClone}/to/{newRoomId}")]
	public async Task<IActionResult> Clone(int idClone, int newRoomId)
	{
		await _service.CloneItemAsync(idClone, newRoomId);
		await TryNotifyRolesAsync(
			GetRoles(),
			new CreateNotificationDto
			{
				Title = "Room inventory item cloned",
				Content = $"Inventory item #{idClone} was cloned to room #{newRoomId}.",
				Type = NotificationAction.RoomInventoryCloned,
				ReferenceLink = "admin/room-inventories"
			});
		return Ok("Clone item completed successfully.");
	}
}