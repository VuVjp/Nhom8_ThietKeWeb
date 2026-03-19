using HotelManagement.Entities;

public interface IUserManagementService
{
    Task<IEnumerable<User>> GetAllUsersAsync();
    Task CreateUserAsync(string email, string password, int roleId);
    Task EditUserAsync(int userId, string email, string password, int roleId);
    Task ChangeRoleByIdAsync(int userId, int roleId);
    Task SoftDeleteUserByIdAsync(int userId);
}