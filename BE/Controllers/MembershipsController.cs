using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MembershipsController : ControllerBase
{
    private readonly IMembershipService _service;
    private readonly INotificationService _notificationService;

    public MembershipsController(IMembershipService service, INotificationService notificationService)
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

    private static IEnumerable<RoleName> GetMembershipRoles()
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
        if (result == null) return NotFound("Không tìm thấy hạng thành viên.");
        return Ok(result);
    }

    // You can enforce permissions if needed: [Permission(PermissionNames.ManageMemberships)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMembershipDto dto)
    {
        var success = await _service.CreateAsync(dto);
        if (!success) return BadRequest("Tạo hạng thành viên thất bại.");

        await TryNotifyRolesAsync(
            GetMembershipRoles(),
            new CreateNotificationDto
            {
                Title = "Membership created",
                Content = $"Membership tier {dto.TierName} was created.",
                Type = NotificationAction.MembershipCreated,
                ReferenceLink = "admin/memberships"
            });

        return Ok("Tạo hạng thành viên thành công.");
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMembershipDto dto)
    {
        var success = await _service.UpdateAsync(id, dto);
        if (!success) return NotFound("Cập nhật thất bại hoặc không tìm thấy hạng thành viên.");

        await TryNotifyRolesAsync(
            GetMembershipRoles(),
            new CreateNotificationDto
            {
                Title = "Membership updated",
                Content = $"Membership tier #{id} was updated.",
                Type = NotificationAction.MembershipUpdated,
                ReferenceLink = $"admin/memberships/{id}"
            });

        return Ok("Cập nhật thành công.");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success) return NotFound("Xóa thất bại hoặc không tìm thấy hạng thành viên.");

        await TryNotifyRolesAsync(
            GetMembershipRoles(),
            new CreateNotificationDto
            {
                Title = "Membership deleted",
                Content = $"Membership tier #{id} was deleted.",
                Type = NotificationAction.MembershipDeleted,
                ReferenceLink = "admin/memberships"
            });

        return Ok("Xóa thành công.");
    }
}
