using System.Security.Claims;
using HotelManagement.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserProfileController : ControllerBase
    {
        private readonly IUserProfileService _userProfileService;

        public UserProfileController(IUserProfileService userProfileService)
        {
            _userProfileService = userProfileService;
        }

        [Authorize]
        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (email == null)
            {
                return Unauthorized();
            }
            var profile = await _userProfileService.GetProfileByEmailAsync(email);
            return Ok(profile);
        }

        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto updateProfileDto)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            if (email == null)
            {
                return Unauthorized();
            }
            var updatedProfile = await _userProfileService.UpdateProfileAsync(email, updateProfileDto);
            return Ok(updatedProfile);
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            if (email == null)
            {
                return Unauthorized();
            }
            var updatedProfile = await _userProfileService.ChangePasswordAsync(email, changePasswordDto.NewPassword, changePasswordDto.CurrentPassword);
            return Ok(updatedProfile);
        }

        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar([FromBody] UploadAvatarDto uploadAvatarDto)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            if (email == null)
            {
                return Unauthorized();
            }
            var updatedProfile = await _userProfileService.UploadAvatarAsync(email, uploadAvatarDto.AvatarUrl);
            return Ok(updatedProfile);
        }
    }
}