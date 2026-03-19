public interface IUserManagementService
{
    Task GetAllUsersAsync(int roleId, int permissionId);
    Task CreateUserAsync(string email, string password, int roleId);
    Task EditUserAsync(int userId, string email, string password, int roleId);
    Task ChangeRoleByIdAsync(int userId, int roleId);
    Task SoftDeleteUserByIdAsync(int userId);
}