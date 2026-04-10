using Microsoft.AspNetCore.Mvc;
using HotelManagement.Dtos;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserManagementController : ControllerBase
{
    private readonly IUserManagementService _userManagementService;
    private readonly INotificationService _notificationService;

    public UserManagementController(IUserManagementService userManagementService, INotificationService notificationService)
    {
        _userManagementService = userManagementService;
        _notificationService = notificationService;
    }

    private static RoleName? ToRoleName(int roleId)
    {
        return Enum.IsDefined(typeof(RoleName), roleId) ? (RoleName)roleId : null;
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

    [Permission(PermissionNames.ManageUsers)]
    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userManagementService.GetAllUsersAsync();
        return Ok(users);
    }

    [Permission(PermissionNames.ManageUsers)]
    [HttpGet("validate")]
    public async Task<IActionResult> ValidateUser([FromQuery] string email)
    {
        return Ok(await _userManagementService.ValidateUserAsync(email));
    }

    [Permission(PermissionNames.ManageUsers)]
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        await _userManagementService.CreateUserAsync(dto.Email, dto.Password, dto.RoleId);

        var targetRole = ToRoleName(dto.RoleId);
        var rolesToNotify = new List<RoleName> { RoleName.Admin, RoleName.Manager };
        if (targetRole.HasValue)
        {
            rolesToNotify.Add(targetRole.Value);
        }

        await TryNotifyRolesAsync(
            rolesToNotify,
            new CreateNotificationDto
            {
                Title = "User account created",
                Content = $"Admin created account for {dto.Email}.",
                Type = NotificationAction.CreateAccount,
                ReferenceLink = "admin/users"
            });

        return NoContent();
    }

    [Permission(PermissionNames.ManageUsers)]
    [HttpPut("{userId}")]
    public async Task<IActionResult> EditUser(int userId, [FromBody] EditUserDto dto)
    {
        await _userManagementService.EditUserAsync(userId, dto.Email, dto.Password, dto.RoleId);
        return NoContent();
    }

    [Permission(PermissionNames.ManageUsers)]
    [HttpPut("{userId}/change-role")]
    public async Task<IActionResult> ChangeUserRole(int userId, [FromBody] ChangeRoleDto dto)
    {
        await _userManagementService.ChangeRoleByIdAsync(userId, dto.RoleId);

        var targetRole = ToRoleName(dto.RoleId);
        var rolesToNotify = new List<RoleName> { RoleName.Admin, RoleName.Manager };
        if (targetRole.HasValue)
        {
            rolesToNotify.Add(targetRole.Value);
        }

        await TryNotifyRolesAsync(
            rolesToNotify,
            new CreateNotificationDto
            {
                Title = "User role changed",
                Content = $"Admin changed role for user ID {userId}.",
                Type = NotificationAction.ChangeRole,
                ReferenceLink = "admin/users"
            });

        return NoContent();
    }

    [Permission(PermissionNames.ManageUsers)]
    [HttpPatch("{userId}/toggle-active")]
    public async Task<IActionResult> ToggleUserActive(int userId)
    {
        var user = (await _userManagementService.GetAllUsersAsync()).FirstOrDefault(x => x.Id == userId);
        await _userManagementService.ToggleUserActiveByIdAsync(userId);

        var isNowActive = user != null ? !(user.IsActive ?? false) : true;
        await TryNotifyRolesAsync(
            new[] { RoleName.Admin, RoleName.Manager },
            new CreateNotificationDto
            {
                Title = isNowActive ? "User activated" : "User deactivated",
                Content = $"Admin {(isNowActive ? "activated" : "deactivated")} user ID {userId}.",
                Type = isNowActive ? NotificationAction.UnlockAccount : NotificationAction.LockAccount,
                ReferenceLink = "admin/users"
            });

        return NoContent();
    }

    [Permission(PermissionNames.ManageUsers)]
    [HttpPost("{userId}/reset-password")]
    public async Task<IActionResult> ResetPassword(int userId)
    {
        await _userManagementService.ResetPasswordAndSendEmailAsync(userId);

        await TryNotifyRolesAsync(
            new[] { RoleName.Admin, RoleName.Manager },
            new CreateNotificationDto
            {
                Title = "Password reset",
                Content = $"Admin reset password for user ID {userId}.",
                Type = NotificationAction.ResetPassword,
                ReferenceLink = "admin/users"
            });

        return Ok(new { Message = "New password has been sent via email." });
    }
}