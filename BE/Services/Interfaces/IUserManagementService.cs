using HotelManagement.Dtos;
using HotelManagement.Entities;

public interface IUserManagementService
{
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task CreateUserAsync(string email, string password, int roleId);
    Task EditUserAsync(int userId, string email, string password, int roleId);
    Task ChangeRoleByIdAsync(int userId, int roleId);
    Task ToggleUserActiveByIdAsync(int userId);
    Task ResetPasswordAndSendEmailAsync(int userId);
    Task<validateUserResponseDto> ValidateUserAsync(string email);
}