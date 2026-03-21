using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

public class UserManagementRepository : Repository<User>, IUserManagementRepository
{
    public UserManagementRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<User>> GetAllUsersAsync()
    {
        return await _context.Users.Include(u => u.Role).ToListAsync();
    }

    public async Task<User?> SoftDeleteUserByIdAsync(int userId)
    {
        var user = await GetByIdAsync(userId);
        if (user != null)
        {
            user.IsActive = false;
            await SaveChangesAsync();
        }
        else
        {
            throw new NotFoundException("User not found.");
        }
        return user;
    }

    public async Task ChangeRoleByIdAsync(int userId, int roleId)
    {
        var user = await GetByIdAsync(userId);

        if (user != null)
        {
            user.RoleId = roleId;
            await SaveChangesAsync();
        }
        else
        {
            throw new NotFoundException("User not found.");
        }
    }
}