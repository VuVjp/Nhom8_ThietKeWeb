using HotelManagement.Entities;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;
using HotelManagement.Dtos;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttractionsController : ControllerBase
{
	private readonly IAttractionService _service;
	private readonly INotificationService _notificationService;

	public AttractionsController(IAttractionService service, INotificationService notificationService)
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
		return new[] { RoleName.Admin, RoleName.Manager };
	}

	[HttpGet]
	public async Task<IActionResult> GetAll()
	{
		var result = await _service.GetAllAsync();
		return Ok(result);
	}

	[HttpGet("{id}")]
	public async Task<IActionResult> GetById(int id)
	{
		var result = await _service.GetByIdAsync(id);
		if (result == null) return NotFound("Không tìm thấy địa điểm.");
		return Ok(result);
	}

	[Permission(PermissionNames.ManageAttractions)]
	[HttpPost]
	public async Task<IActionResult> Create([FromForm] CreateAttractionDto dto)
	{
		var success = await _service.CreateAsync(dto);
		if (!success) return BadRequest("Tạo địa điểm thất bại.");

		await TryNotifyRolesAsync(
			GetRoles(),
			new CreateNotificationDto
			{
				Title = "Attraction created",
				Content = $"Attraction {dto.Name} was created.",
				Type = NotificationAction.AttractionCreated,
				ReferenceLink = "admin/attractions"
			});

		return Ok("Tạo địa điểm thành công.");
	}

	[Permission(PermissionNames.ManageAttractions)]
	[HttpPut("{id}")]
	public async Task<IActionResult> Update(int id, [FromForm] UpdateAttractionDto dto)
	{
		var success = await _service.UpdateAsync(id, dto);
		if (!success) return NotFound("Cập nhật thất bại hoặc không tìm thấy địa điểm.");

		await TryNotifyRolesAsync(
			GetRoles(),
			new CreateNotificationDto
			{
				Title = "Attraction updated",
				Content = $"Attraction #{id} was updated.",
				Type = NotificationAction.AttractionUpdated,
				ReferenceLink = $"admin/attractions/{id}"
			});

		return Ok("Cập nhật thành công.");
	}

	[Permission(PermissionNames.ManageAttractions)]
	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(int id)
	{
		var success = await _service.DeleteAsync(id);
		if (!success) return NotFound("Xóa thất bại hoặc không tìm thấy địa điểm.");

		await TryNotifyRolesAsync(
			GetRoles(),
			new CreateNotificationDto
			{
				Title = "Attraction deleted",
				Content = $"Attraction #{id} was deleted.",
				Type = NotificationAction.AttractionDeleted,
				ReferenceLink = "admin/attractions"
			});

		return Ok("Xóa thành công.");
	}
}