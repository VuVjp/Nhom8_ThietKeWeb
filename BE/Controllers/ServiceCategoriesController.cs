using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiceCategoriesController : ControllerBase
{
    private readonly IServiceCategoryService _service;
    private readonly INotificationService _notificationService;

    public ServiceCategoriesController(IServiceCategoryService service, INotificationService notificationService)
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
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("paged")]
    public async Task<IActionResult> GetPaged([FromQuery] ServiceCategoryQueryDto query)
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
    public async Task<IActionResult> Create(CreateServiceCategoryDto dto)
    {
        var ok = await _service.CreateAsync(dto);
        if (!ok) return BadRequest();

        await TryNotifyRolesAsync(
            GetRoles(),
            new CreateNotificationDto
            {
                Title = "Service category created",
                Content = $"Service category {dto.Name} was created.",
                Type = NotificationAction.ServiceCategoryCreated,
                ReferenceLink = "admin/service-categories"
            });

        return Ok();
    }

    [Permission(PermissionNames.ManageServices)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateServiceCategoryDto dto)
    {
        var ok = await _service.UpdateAsync(id, dto);
        if (!ok) return NotFound();

        await TryNotifyRolesAsync(
            GetRoles(),
            new CreateNotificationDto
            {
                Title = "Service category updated",
                Content = $"Service category #{id} was updated.",
                Type = NotificationAction.ServiceCategoryUpdated,
                ReferenceLink = $"admin/service-categories/{id}"
            });

        return NoContent();
    }

    [Permission(PermissionNames.ManageServices)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var ok = await _service.DeleteAsync(id);
            if (!ok) return NotFound();

            await TryNotifyRolesAsync(
                GetRoles(),
                new CreateNotificationDto
                {
                    Title = "Service category deleted",
                    Content = $"Service category #{id} was deleted.",
                    Type = NotificationAction.ServiceCategoryDeleted,
                    ReferenceLink = "admin/service-categories"
                });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Permission(PermissionNames.ManageServices)]
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var ok = await _service.ToggleActiveAsync(id);
        if (!ok) return NotFound();

        await TryNotifyRolesAsync(
            GetRoles(),
            new CreateNotificationDto
            {
                Title = "Service category active status changed",
                Content = $"Service category #{id} active status was toggled.",
                Type = NotificationAction.ServiceCategoryActivated,
                ReferenceLink = $"admin/service-categories/{id}"
            });

        return Ok(new { message = "Category active status toggled successfully." });
    }

    [Permission(PermissionNames.ManageServices)]
    [HttpPatch("{id}/restore")]
    public async Task<IActionResult> Restore(int id)
    {
        var ok = await _service.RestoreAsync(id);
        if (!ok) return NotFound();

        await TryNotifyRolesAsync(
            GetRoles(),
            new CreateNotificationDto
            {
                Title = "Service category restored",
                Content = $"Service category #{id} was restored.",
                Type = NotificationAction.ServiceCategoryRestored,
                ReferenceLink = $"admin/service-categories/{id}"
            });

        return Ok(new { message = "Category restored successfully." });
    }
}
