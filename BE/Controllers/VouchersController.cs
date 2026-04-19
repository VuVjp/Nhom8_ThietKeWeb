using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VouchersController : ControllerBase
{
    private readonly IVoucherService _service;
    private readonly INotificationService _notificationService;

    public VouchersController(IVoucherService service, INotificationService notificationService)
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

    private static IEnumerable<RoleName> GetVoucherRoles()
    {
        return new[] { RoleName.Admin, RoleName.Manager, RoleName.Accountant };
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [Permission(PermissionNames.ManageVouchers)]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var data = await _service.GetByIdAsync(id);
        if (data == null)
        {
            return NotFound();
        }

        return Ok(data);
    }

    [HttpGet("validate")]
    public async Task<IActionResult> ValidateCode([FromQuery] string code, [FromQuery] decimal? bookingAmount)
    {
        try
        {
            return Ok(await _service.ValidateCodeAsync(code, bookingAmount));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Permission(PermissionNames.ManageVouchers)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVoucherDto dto)
    {
        var ok = await _service.CreateAsync(dto);
        if (!ok)
        {
            return BadRequest(new { message = "Failed to create voucher." });
        }

        await TryNotifyRolesAsync(
            GetVoucherRoles(),
            new CreateNotificationDto
            {
                Title = "Voucher created",
                Content = $"Voucher {dto.Code} was created with {dto.DiscountType} discount.",
                Type = NotificationAction.VoucherCreated,
                ReferenceLink = "admin/vouchers"
            });

        return Ok();
    }

    [Permission(PermissionNames.ManageVouchers)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateVoucherDto dto)
    {
        var ok = await _service.UpdateAsync(id, dto);
        if (!ok)
        {
            return NotFound();
        }

        await TryNotifyRolesAsync(
            GetVoucherRoles(),
            new CreateNotificationDto
            {
                Title = "Voucher updated",
                Content = $"Voucher #{id} was updated.",
                Type = NotificationAction.VoucherUpdated,
                ReferenceLink = $"admin/vouchers/{id}"
            });

        return NoContent();
    }

    [Permission(PermissionNames.ManageVouchers)]
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var ok = await _service.ToggleActiveAsync(id);
        if (!ok)
        {
            return NotFound();
        }

        var voucher = await _service.GetByIdAsync(id);
        var isActive = voucher?.IsActive ?? true;

        await TryNotifyRolesAsync(
            GetVoucherRoles(),
            new CreateNotificationDto
            {
                Title = isActive ? "Voucher activated" : "Voucher deactivated",
                Content = $"Voucher #{id} is now {(isActive ? "active" : "inactive")}.",
                Type = isActive ? NotificationAction.VoucherActivated : NotificationAction.VoucherDeactivated,
                ReferenceLink = $"admin/vouchers/{id}"
            });

        return Ok(new { message = "Voucher active status toggled successfully." });
    }
}