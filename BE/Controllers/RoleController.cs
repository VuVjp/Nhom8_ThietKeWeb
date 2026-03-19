using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using HotelManagement.Dtos;
namespace HotelManagement.Controllers
{
    [ApiController]
    [Route("api/roles")]
    public class RoleController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RoleController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpPost("assign-permission")]
        public async Task<IActionResult> AssignPermission([FromBody] AssignPermissionDto dto)
        {
            await _roleService.AssignPermissionAsync(dto.roleId, dto.PermissionId);
            return Ok();
        }

        [HttpGet("my-permissions")]
        public async Task<IActionResult> GetMyPermissions()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var permissions = await _roleService.GetMyPermissionsAsync(userId);
            return Ok(permissions);
        }
    }
}