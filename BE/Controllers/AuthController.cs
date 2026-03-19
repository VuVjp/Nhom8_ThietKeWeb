using Microsoft.AspNetCore.Mvc;
using Services.Interfaces;
using HotelManagement.Dtos;

namespace HotelManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var (userId, email, role) = await _authService.RegisterAsync(dto.Email, dto.FullName, dto.Password);

            return Ok(new { Id = userId, Email = email, Role = role });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var (token, refreshToken) = await _authService.LoginAsync(dto.Email, dto.Password);

            return Ok(new { Token = token, RefreshToken = refreshToken });
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            var (token, refreshToken) = await _authService.AuthenticateGoogleAsync(request.IdToken);

            return Ok(new { Token = token, RefreshToken = refreshToken });
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest refreshToken)
        {
            var (newJwt, newRefreshToken) = await _authService.RefreshTokenAsync(refreshToken.RefreshToken);

            return Ok(new { Token = newJwt, RefreshToken = newRefreshToken });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest refreshToken)
        {
            await _authService.LogoutAsync(refreshToken.RefreshToken);
            return Ok(new { Message = "Logged out successfully" });
        }
    }
}