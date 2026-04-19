using HotelManagement.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PermissionsController : ControllerBase
{
    private readonly IRoleService _roleService;
    private readonly INotificationService _notificationService;

    public PermissionsController(IRoleService roleService, INotificationService notificationService)
    {
        _roleService = roleService;
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

    private static RoleName? ToRoleName(int roleId)
    {
        return Enum.IsDefined(typeof(RoleName), roleId) ? (RoleName)roleId : null;
    }

    [Permission(PermissionNames.ManageRoles)]
    [Authorize]
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _roleService.GetAllRolesAsync();
        return Ok(roles);
    }

    [Authorize]
    [HttpGet("catalog")]
    public async Task<IActionResult> GetPermissionCatalog()
    {
        var permissions = await _roleService.GetAllPermissionNamesAsync();
        return Ok(permissions);
    }

    [Permission(PermissionNames.ManageRoles)]
    [Authorize]
    [HttpPut("roles/{roleId}")]
    public async Task<IActionResult> UpdateRolePermissions(int roleId, [FromBody] UpdateRolePermissionsDto dto)
    {
        await _roleService.UpdateRolePermissionsAsync(roleId, dto.PermissionNames);

        var targetRole = ToRoleName(roleId);
        var rolesToNotify = new List<RoleName> { RoleName.Admin, RoleName.Manager };
        if (targetRole.HasValue)
        {
            rolesToNotify.Add(targetRole.Value);
        }

        await TryNotifyRolesAsync(
            rolesToNotify,
            new CreateNotificationDto
            {
                Title = "Role permissions updated",
                Content = $"Permissions for role ID {roleId} were updated.",
                Type = NotificationAction.RolePermissionsUpdated,
                ReferenceLink = "admin/permissions"
            });

        return NoContent();
    }

    [Permission(PermissionNames.ManageRoles)]
    [Authorize]
    [HttpPost("assign")]
    public async Task<IActionResult> AssignPermission([FromBody] AssignPermissionDto dto)
    {
        await _roleService.AssignPermissionAsync(dto.roleId, dto.PermissionId);

        var targetRole = ToRoleName(dto.roleId);
        var rolesToNotify = new List<RoleName> { RoleName.Admin, RoleName.Manager };
        if (targetRole.HasValue)
        {
            rolesToNotify.Add(targetRole.Value);
        }

        await TryNotifyRolesAsync(
            rolesToNotify,
            new CreateNotificationDto
            {
                Title = "Permission assigned",
                Content = $"Permission ID {dto.PermissionId} was assigned to role ID {dto.roleId}.",
                Type = NotificationAction.PermissionAssigned,
                ReferenceLink = "admin/permissions"
            });

        return Ok();
    }

    [Authorize]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyPermissions()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var permissions = await _roleService.GetMyPermissionsAsync(userId);
        return Ok(permissions);
    }
}
