using HotelManagement.Entities;

public interface IUserManagementRepository : IRepository<User>
{
    Task<User?> SoftDeleteUserByIdAsync(int userId);
    Task ChangeRoleByIdAsync(int userId, int roleId);
}