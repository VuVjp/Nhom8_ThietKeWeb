using HotelManagement.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PermissionsController : ControllerBase
{
    private readonly IRoleService _roleService;

    public PermissionsController(IRoleService roleService)
    {
        _roleService = roleService;
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
        return NoContent();
    }

    [Permission(PermissionNames.ManageRoles)]
    [Authorize]
    [HttpPost("assign")]
    public async Task<IActionResult> AssignPermission([FromBody] AssignPermissionDto dto)
    {
        await _roleService.AssignPermissionAsync(dto.roleId, dto.PermissionId);
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
