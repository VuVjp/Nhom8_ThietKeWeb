using HotelManagement.Entities;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByGoogleIdAsync(string id);
    Task<User?> LockUserById(int id);
    Task<User?> GetUserByIdAsync(int id);
    Task<User?> ChangeRoleUserById(int id, string newRole);
}