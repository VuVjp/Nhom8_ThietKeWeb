using HotelManagement.Entities;

public interface IUserManagementRepository : IRepository<User>
{
    Task ChangeRoleByIdAsync(int userId, int roleId);
}