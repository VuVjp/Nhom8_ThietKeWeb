using Microsoft.EntityFrameworkCore;
using HotelManagement.Data;
using HotelManagement.Entities;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context)
    {
    }
    public async Task<string> GetUserRoleAsync(int userId)
    {
        var user = await _dbSet.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
        return user?.Role?.Name ?? "Unknown";
    }

    public async Task<List<User>> GetUsersByRoleAsync(string roleName)
    {
        return await _dbSet
            .Include(u => u.Role)
            .Where(u => u.Role!.Name == roleName)
            .ToListAsync();
    }

    public async Task<bool> IsEmailExistAsync(string email)
    {
        return await _dbSet.AnyAsync(u => u.Email == email);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> ChangeRoleUserById(int id, string newRole)
    {
        var user = await GetByIdAsync(id);
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