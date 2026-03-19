using HotelManagement.Entities;

public interface IUserRepository : IRepository<User>
{
    Task<bool> IsEmailExistAsync(string email);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByGoogleIdAsync(string id);
}