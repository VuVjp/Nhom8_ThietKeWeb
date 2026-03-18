using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using HotelManagement.Dtos;
namespace HotelManagement.Controllers
{
    [ApiController]
    [Route("api/roles")]
    public class RoleController : ControllerBase
    {
        private readonly IRoleRepository _roleRepository;

        public RoleController(IRoleRepository roleRepository)
        {
            _roleRepository = roleRepository;
        }

        [HttpPost("assign-role")]
        public async Task<IActionResult> AssignRole([FromBody] AssignRoleDto dto)
        {
            await _roleRepository.AssignRoleAsync(dto.UserId, dto.RoleId);
            return Ok();
        }

        [HttpGet("my-permissions")]
        public async Task<IActionResult> GetMyPermissions()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var permissions = await _roleRepository.GetMyPermissionsAsync(userId);
            return Ok(permissions);
        }
    }
}