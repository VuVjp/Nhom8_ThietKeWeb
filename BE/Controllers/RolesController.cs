using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using HotelManagement.Dtos;
using Microsoft.AspNetCore.Authorization;
namespace HotelManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _roleService;
        private readonly INotificationService _notificationService;

        public RolesController(IRoleService roleService, INotificationService notificationService)
        {
            _roleService = roleService;
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

        [Permission(PermissionNames.ManageRoles)]
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllRoles()
        {
            var roles = await _roleService.GetAllRolesAsync();
            return Ok(roles);
        }

        [HttpGet("permissions")]
        [Authorize]
        public async Task<IActionResult> GetAllPermissions()
        {
            var permissions = await _roleService.GetAllPermissionNamesAsync();
            return Ok(permissions);
        }

        [Permission(PermissionNames.ManageRoles)]
        [HttpPost("assign-permission")]
        [Authorize]
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
                    Title = "Role permission updated",
                    Content = $"Admin assigned permission ID {dto.PermissionId} to role ID {dto.roleId}.",
                    Type = NotificationAction.ChangeRole,
                    ReferenceLink = "/roles"
                });

            return Ok();
        }

        [Permission(PermissionNames.ManageRoles)]
        [HttpPut("{roleId}/permissions")]
        [Authorize]
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
                    Title = "Role permissions changed",
                    Content = $"Admin updated permissions for role ID {roleId}.",
                    Type = NotificationAction.ChangeRole,
                    ReferenceLink = "/roles"
                });

            return NoContent();
        }

        [Authorize]
        [HttpGet("my-permissions")]
        public async Task<IActionResult> GetMyPermissions()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var permissions = await _roleService.GetMyPermissionsAsync(userId);
            return Ok(permissions);
        }
    }
}