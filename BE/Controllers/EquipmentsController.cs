using Microsoft.AspNetCore.Mvc;
using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;

[ApiController]
[Route("api/[controller]")]
public class EquipmentsController : ControllerBase
{
    private readonly IEquipmentService _service;
    private readonly INotificationService _notificationService;

    public EquipmentsController(IEquipmentService service, INotificationService notificationService)
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

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        return Ok(await _service.GetByIdAsync(id));
    }

    [Permission(PermissionNames.ManageEquipments)]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateEquipmentDto dto)
    {
        var ok = await _service.CreateAsync(dto);
        if (!ok)
        {
            return BadRequest();
        }

        await TryNotifyRolesAsync(
            GetRoles(),
            new CreateNotificationDto
            {
                Title = "Equipment created",
                Content = $"Equipment {dto.Name ?? dto.ItemCode ?? "N/A"} was created.",
                Type = NotificationAction.EquipmentCreated,
                ReferenceLink = "admin/equipments"
            });

        return Ok();
    }

    [Permission(PermissionNames.ManageEquipments)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromForm] UpdateEquipmentDto dto)
    {
        var ok = await _service.UpdateAsync(id, dto);
        
        if (!ok)
        {
            return NotFound();
        }

        await TryNotifyRolesAsync(
            GetRoles(),
            new CreateNotificationDto
            {
                Title = "Equipment updated",
                Content = $"Equipment #{id} was updated.",
                Type = NotificationAction.EquipmentUpdated,
                ReferenceLink = $"admin/equipments/{id}"
            });

        return NoContent();
    }

    [Permission(PermissionNames.ManageEquipments)]
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var ok = await _service.ToggleActiveAsync(id);
        if (!ok)
        {
            return NotFound();
        }

        var equipment = await _service.GetByIdAsync(id);
        var isActive = equipment?.IsActive ?? true;

        await TryNotifyRolesAsync(
            GetRoles(),
            new CreateNotificationDto
            {
                Title = isActive ? "Equipment activated" : "Equipment deactivated",
                Content = $"Equipment #{id} is now {(isActive ? "active" : "inactive")}.",
                Type = NotificationAction.EquipmentActivated,
                ReferenceLink = $"admin/equipments/{id}"
            });

        return Ok("Equipment active status toggled successfully.");
    }
}
