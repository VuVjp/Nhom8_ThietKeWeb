using HotelManagement.Entities;

public interface IUserManagementRepository : IRepository<User>
{
    Task<User?> SoftDeleteUserByIdAsync(int userId);
    Task<IEnumerable<User>> GetAllUsersAsync();
    Task ChangeRoleByIdAsync(int userId, int roleId);
}