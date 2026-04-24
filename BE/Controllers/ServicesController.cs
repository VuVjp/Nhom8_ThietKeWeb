using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly IServiceService _service;
    private readonly INotificationService _notificationService;

    public ServicesController(IServiceService service, INotificationService notificationService)
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

    private static IEnumerable<RoleName> GetServiceRoles()
    {
        return new[] { RoleName.Admin, RoleName.Manager };
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] ServiceQueryDto query)
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

    [Permission(PermissionNames.ManageServices)]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateServiceDto dto)
    {
        try
        {
            var ok = await _service.CreateAsync(dto);
            if (!ok) return BadRequest();

            await TryNotifyRolesAsync(
                GetServiceRoles(),
                new CreateNotificationDto
                {
                    Title = "Service created",
                    Content = $"Service {dto.Name} was created.",
                    Type = NotificationAction.ServiceCreated,
                    ReferenceLink = "admin/services"
                });

            return Ok();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Permission(PermissionNames.ManageServices)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromForm] UpdateServiceDto dto)
    {
        try
        {
            var ok = await _service.UpdateAsync(id, dto);
            if (!ok) return NotFound();

            await TryNotifyRolesAsync(
                GetServiceRoles(),
                new CreateNotificationDto
                {
                    Title = "Service updated",
                    Content = $"Service #{id} was updated.",
                    Type = NotificationAction.ServiceUpdated,
                    ReferenceLink = $"admin/services/{id}"
                });

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Permission(PermissionNames.ManageServices)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _service.DeleteAsync(id);
        if (!ok) return NotFound();

        await TryNotifyRolesAsync(
            GetServiceRoles(),
            new CreateNotificationDto
            {
                Title = "Service deleted",
                Content = $"Service #{id} was deleted.",
                Type = NotificationAction.ServiceDeleted,
                ReferenceLink = "admin/services"
            });

        return NoContent();
    }

    [Permission(PermissionNames.ManageServices)]
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var ok = await _service.ToggleActiveAsync(id);
        if (!ok) return NotFound();

        var service = await _service.GetByIdAsync(id);
        var isActive = service?.IsActive ?? true;

        await TryNotifyRolesAsync(
            GetServiceRoles(),
            new CreateNotificationDto
            {
                Title = isActive ? "Service activated" : "Service deactivated",
                Content = $"Service #{id} is now {(isActive ? "active" : "inactive")}.",
                Type = NotificationAction.ServiceActivated,
                ReferenceLink = $"admin/services/{id}"
            });

        return Ok(new { message = "Service active status toggled successfully." });
    }

    [Permission(PermissionNames.ManageServices)]
    [HttpPatch("{id}/restore")]
    public async Task<IActionResult> Restore(int id)
    {
        var ok = await _service.RestoreAsync(id);
        if (!ok) return NotFound();

        await TryNotifyRolesAsync(
            GetServiceRoles(),
            new CreateNotificationDto
            {
                Title = "Service restored",
                Content = $"Service #{id} was restored.",
                Type = NotificationAction.ServiceRestored,
                ReferenceLink = $"admin/services/{id}"
            });

        return Ok(new { message = "Service restored successfully." });
    }
}
