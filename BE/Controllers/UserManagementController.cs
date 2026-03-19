using Microsoft.AspNetCore.Mvc;
using HotelManagement.Dtos;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserManagementController : ControllerBase
{
    private readonly IUserManagementService _userManagementService;

    public UserManagementController(IUserManagementService userManagementService)
    {
        _userManagementService = userManagementService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userManagementService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        await _userManagementService.CreateUserAsync(dto.Email, dto.Password, dto.RoleId);
        return NoContent();
    }

    [HttpPut("{userId}")]
    public async Task<IActionResult> EditUser(int userId, [FromBody] EditUserDto dto)
    {
        await _userManagementService.EditUserAsync(userId, dto.Email, dto.Password, dto.RoleId);
        return NoContent();
    }

    [HttpPut("{userId}/change-role")]
    public async Task<IActionResult> ChangeUserRole(int userId, [FromBody] ChangeRoleDto dto)
    {
        await _userManagementService.ChangeRoleByIdAsync(userId, dto.RoleId);
        return NoContent();
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> SoftDeleteUser(int userId)
    {
        await _userManagementService.SoftDeleteUserByIdAsync(userId);
        return NoContent();
    }
}