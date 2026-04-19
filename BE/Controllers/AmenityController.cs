using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class AmenitiesController : ControllerBase
{
    private readonly IAmenityService _service;
    private readonly INotificationService _notificationService;

    public AmenitiesController(IAmenityService service, INotificationService notificationService)
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
        var data = await _service.GetByIdAsync(id);
        if (data == null) return NotFound();
        return Ok(data);
    }

    [Permission(PermissionNames.ManageAmenity)]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateAmenityRequestDto dto)
    {
        var ok = await _service.CreateAsync(dto);

        if (!ok) return BadRequest();

        await TryNotifyRolesAsync(
            GetRoles(),
            new CreateNotificationDto
            {
                Title = "Amenity created",
                Content = $"Amenity {dto.Name} was created.",
                Type = NotificationAction.AmenityCreated,
                ReferenceLink = "admin/amenities"
            });

        return Ok();
    }

    [Permission(PermissionNames.ManageAmenity)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromForm] UpdateAmenityDto dto)
    {
        var ok = await _service.UpdateAsync(id, dto);
        if (!ok) return NotFound();

        await TryNotifyRolesAsync(
            GetRoles(),
            new CreateNotificationDto
            {
                Title = "Amenity updated",
                Content = $"Amenity #{id} was updated.",
                Type = NotificationAction.AmenityUpdated,
                ReferenceLink = $"admin/amenities/{id}"
            });

        return NoContent();
    }


    [Permission(PermissionNames.ManageAmenity)]
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var ok = await _service.ToggleActiveAsync(id);
        if (!ok) return NotFound();

        var amenity = await _service.GetByIdAsync(id);
        var isActive = amenity?.IsActive ?? true;

        await TryNotifyRolesAsync(
            GetRoles(),
            new CreateNotificationDto
            {
                Title = isActive ? "Amenity activated" : "Amenity deactivated",
                Content = $"Amenity #{id} is now {(isActive ? "active" : "inactive")}.",
                Type = isActive ? NotificationAction.AmenityActivated : NotificationAction.AmenityDeactivated,
                ReferenceLink = $"admin/amenities/{id}"
            });

        return Ok("Amenity active status toggled successfully.");
    }
}