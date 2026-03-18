using Microsoft.EntityFrameworkCore;
using HotelManagement.Data;
using HotelManagement.Entities;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> LockUserById(int id)
    {
        var user = await _dbSet.FindAsync(id);
        if (user != null)
        {
            user.IsLocked = true;
            await SaveChangesAsync();
        }
        return user;
    }

    public async Task<User?> ChangeRoleUserById(int id, string newRole)
    {
        var user = await _dbSet.FindAsync(id);
        if (user != null)
        {
            user.Role = new Role { Name = newRole };
            await SaveChangesAsync();
        }
        return user;
    }
    public async Task<User?> GetByGoogleIdAsync(string id)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.GoogleId == id);
    }
}