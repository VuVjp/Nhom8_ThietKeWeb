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
	private readonly INotificationService _notificationService;

	public RoomsController(IRoomService service, INotificationService notificationService)
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

		await TryNotifyRolesAsync(
			new[] { RoleName.Manager, RoleName.Housekeeping },
			new CreateNotificationDto
			{
				Title = requested ? "Cleaning requested" : "Cleaning request canceled",
				Content = $"Room #{id} cleaning request is now {(requested ? "enabled" : "disabled")}.",
				Type = NotificationAction.RoomCleaningStatusChanged,
				ReferenceLink = $"admin/rooms/{id}"
			});

		return Ok("Cleaning request updated successfully.");
	}

	[Permission(PermissionNames.UpdateCleaning)]
	[HttpPatch("{id}/complete-cleaning")]
	public async Task<IActionResult> CompleteCleaningRequest(int id)
	{
		try
		{
			await _service.ChangeCleaningRequestedAsync(id, false);

			await TryNotifyRolesAsync(
				new[] { RoleName.Manager, RoleName.Housekeeping },
				new CreateNotificationDto
				{
					Title = "Cleaning completed",
					Content = $"Room #{id} cleaning has been completed and request cleared.",
					Type = NotificationAction.RoomCleaningStatusChanged,
					ReferenceLink = $"admin/rooms/{id}"
				});

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

			if (result)
			{
				await TryNotifyRolesAsync(
					new[] { RoleName.Admin, RoleName.Manager },
					new CreateNotificationDto
					{
						Title = "Room created",
						Content = $"Room {room.RoomNumber} was created successfully.",
						Type = NotificationAction.RoomCreated,
						ReferenceLink = "admin/rooms"
					});
			}

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
			var roomList = rooms.ToList();
			var createdCount = await _service.CreateRoomsBulkAsync(rooms);

			if (createdCount > 0)
			{
				await TryNotifyRolesAsync(
					new[] { RoleName.Admin, RoleName.Manager },
					new CreateNotificationDto
					{
						Title = "Bulk room creation completed",
						Content = $"Created {createdCount} room(s) from {roomList.Count} submitted room(s).",
						Type = NotificationAction.RoomBulkCreated,
						ReferenceLink = "admin/rooms"
					});
			}

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

			var rolesToNotify = new List<RoleName> { RoleName.Manager, RoleName.Housekeeping };
			var normalizedStatus = newStatus.Trim().ToUpperInvariant();
			if (normalizedStatus is "MAINTENANCE" or "UNAVAILABLE" or "INACTIVE")
			{
				rolesToNotify.Add(RoleName.Admin);
				rolesToNotify.Add(RoleName.Maintenance);
			}

			await TryNotifyRolesAsync(
				rolesToNotify,
				new CreateNotificationDto
				{
					Title = "Room status changed",
					Content = $"Room #{id} status changed to {newStatus}.",
					Type = NotificationAction.RoomStatusChanged,
					ReferenceLink = $"admin/rooms/{id}"
				});

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

			await TryNotifyRolesAsync(
				new[] { RoleName.Manager, RoleName.Housekeeping },
				new CreateNotificationDto
				{
					Title = "Room cleaning status changed",
					Content = $"Room #{id} cleaning status changed to {newCleaningStatus}.",
					Type = NotificationAction.RoomCleaningStatusChanged,
					ReferenceLink = $"admin/rooms/{id}"
				});

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

			if (result)
			{
				await TryNotifyRolesAsync(
					new[] { RoleName.Admin, RoleName.Manager },
					new CreateNotificationDto
					{
						Title = "Room updated",
						Content = $"Room #{id} was updated.",
						Type = NotificationAction.RoomUpdated,
						ReferenceLink = $"admin/rooms/{id}"
					});
			}

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

		if (result)
		{
			await TryNotifyRolesAsync(
				new[] { RoleName.Admin, RoleName.Manager },
				new CreateNotificationDto
				{
					Title = "Room deleted",
					Content = $"Room #{id} was deleted.",
					Type = NotificationAction.RoomDeleted,
					ReferenceLink = "admin/rooms"
				});
		}

		return result ? Ok("Room deleted successfully.") : NotFound();
	}
}