using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

class RoleRepository : Repository<Role>, IRoleRepository
{

    public RoleRepository(AppDbContext context) : base(context)
    {
    }

    public async Task AssignRoleAsync(int userId, int roleId)
    {
        var user = await _context.Users.Include(u => u.Role).ThenInclude(r => r!.RolePermissions)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || user.Role == null)
            throw new Exception("User or Role not found");

        user.RoleId = roleId;

        await _context.SaveChangesAsync();
    }

    public async Task<List<string>> GetMyPermissionsAsync(int userId)
    {
        var permissions = await _context.Users
            .Where(u => u.Id == userId)
            .SelectMany(u => u.Role!.RolePermissions)
            .Select(rp => rp.Permission.Name)
            .ToListAsync();

        return permissions;
    }
}