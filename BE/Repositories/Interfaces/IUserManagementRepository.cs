using HotelManagement.Entities;

public interface IUserManagementRepository : IRepository<User>
{
    Task<User?> ToggleUserActiveByIdAsync(int userId);
    Task<IEnumerable<User>> GetAllUsersAsync();
    Task ChangeRoleByIdAsync(int userId, int roleId);
}