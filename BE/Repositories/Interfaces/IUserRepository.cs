using HotelManagement.Entities;

public interface IUserRepository : IRepository<User>
{
    Task <List<User>> GetUsersByRoleAsync(string roleName);
    Task<string> GetUserRoleAsync(int userId);
    Task<bool> IsEmailExistAsync(string email);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByGoogleIdAsync(string id);
}