using HotelManagement.Dtos;
using HotelManagement.Entities;

public interface IUserProfileService
{
    Task<User?> GetProfileByEmailAsync(string email);
    Task<User?> UpdateProfileAsync(string email, UpdateProfileDto updateProfileDto);
    Task<User?> ChangePasswordAsync(string email, string newPassword, string currentPassword);
    Task<User?> UploadAvatarAsync(string email, string avatarUrl);
}