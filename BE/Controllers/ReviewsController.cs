using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using HotelManagement.Dtos;
using System;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _service;
    private readonly INotificationService _notificationService;

    public ReviewsController(IReviewService service, INotificationService notificationService)
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
    public async Task<IActionResult> GetPaged([FromQuery] ReviewQueryDto query)
    {
        return Ok(await _service.GetPagedAsync(query));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var data = await _service.GetByIdAsync(id);
        if (data == null) return NotFound();
        return Ok(data);
    }

    [Permission(PermissionNames.ManageReviews)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _service.DeleteAsync(id);
        if (!ok) return NotFound();

        await TryNotifyRolesAsync(
            GetRoles(),
            new CreateNotificationDto
            {
                Title = "Review deleted",
                Content = $"Review #{id} was deleted.",
                Type = NotificationAction.ReviewDeleted,
                ReferenceLink = "admin/reviews"
            });

        return NoContent();
    }

    [Permission(PermissionNames.ManageReviews)]
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var ok = await _service.ToggleActiveAsync(id);
        if (!ok) return NotFound();

        var review = await _service.GetByIdAsync(id);
        var isActive = review?.IsActive ?? true;

        await TryNotifyRolesAsync(
            GetRoles(),
            new CreateNotificationDto
            {
                Title = isActive ? "Review activated" : "Review deactivated",
                Content = $"Review #{id} is now {(isActive ? "active" : "inactive")}.",
                Type = isActive ? NotificationAction.ReviewActivated : NotificationAction.ReviewDeactivated,
                ReferenceLink = $"admin/reviews/{id}"
            });

        return Ok(new { message = "Review active status toggled successfully." });
    }
}
