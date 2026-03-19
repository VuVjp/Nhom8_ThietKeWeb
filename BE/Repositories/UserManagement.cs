using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

public class UserManagement : Repository<User>, IUserManagementRepository
{
    public UserManagement(AppDbContext context) : base(context)
    {
    }

    public async Task ChangeRoleByIdAsync(int userId, int roleId)
    {
        var user = await GetByIdAsync(userId);

        if (!await _context.Roles.AnyAsync(r => r.Id == roleId))
        {
            throw new NotFoundException("Role not found");
        }

        if (user != null)
        {
            user.RoleId = roleId;
            await SaveChangesAsync();
        }
    }
}