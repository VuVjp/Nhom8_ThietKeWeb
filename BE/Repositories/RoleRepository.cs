using HotelManagement.Data;
using HotelManagement.Dtos;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

class RoleRepository : Repository<Role>, IRoleRepository
{

    public RoleRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<bool> IsRoleExistAsync(int id)
    {
        return await _dbSet.AnyAsync(r => r.Id == id);
    }

    public async Task AssignPermissionAsync(int roleId, int permissionId)
    {
        var roleExists = await _context.Roles
            .AnyAsync(r => r.Id == roleId);

        if (!roleExists)
            throw new NotFoundException("Role not found");

        var permissionExists = await _context.Permissions
            .AnyAsync(p => p.Id == permissionId);

        if (!permissionExists)
            throw new NotFoundException("Permission not found");

        var exists = await _context.RolePermissions
            .AnyAsync(rp => rp.RoleId == roleId && rp.PermissionId == permissionId);

        if (exists)
            throw new ConflictException("Permission already assigned to role");

        _context.RolePermissions.Add(new RolePermission
        {
            RoleId = roleId,
            PermissionId = permissionId
        });

        await _context.SaveChangesAsync();
    }

    public async Task<List<RoleResponseDto>> GetAllRolesAsync()
    {
        var roles = await _context.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .ToListAsync();

        return roles.Select(r => new RoleResponseDto
        {
            Id = r.Id,
            Name = r.Name,
            Permissions = r.RolePermissions.Select(rp => rp.Permission.Name).ToList()
        }).ToList();
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