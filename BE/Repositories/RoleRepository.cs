using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

class RoleRepository : Repository<Role>, IRoleRepository
{

    public RoleRepository(AppDbContext context) : base(context)
    {
    }

    public async Task AssignPermissionAsync(int roleId, int permissionId)
    {
        var role = await _context.Roles.Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == roleId);

        if (role == null)
            throw new Exception("Role not found");

        var permission = await _context.Permissions.FindAsync(permissionId);
        if (permission == null)
            throw new Exception("Permission not found");

        role.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permissionId });
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