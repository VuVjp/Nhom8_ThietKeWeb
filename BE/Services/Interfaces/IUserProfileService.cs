using HotelManagement.Dtos;
using HotelManagement.Entities;

public interface IUserProfileService
{
    Task<UserDto?> GetProfileByEmailAsync(string email);
    Task<UserDto?> UpdateProfileAsync(string email, UpdateProfileDto updateProfileDto);
    Task<UserDto?> ChangePasswordAsync(string email, string newPassword, string currentPassword);
    Task<UserDto?> UploadAvatarAsync(string email, string avatarUrl);
}