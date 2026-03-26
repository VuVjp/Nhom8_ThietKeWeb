using HotelManagement.Data;
using HotelManagement.Dtos;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;
using System.Linq;

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

    public async Task<List<string>> GetAllPermissionNamesAsync()
    {
        return await _context.Permissions
            .Select(p => p.Name)
            .OrderBy(name => name)
            .ToListAsync();
    }

    public async Task UpdateRolePermissionsAsync(int roleId, IEnumerable<string> permissionNames)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == roleId);

        if (role == null)
        {
            throw new NotFoundException("Role not found");
        }

        var normalizedNames = permissionNames
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var permissions = await _context.Permissions
            .Where(p => normalizedNames.Contains(p.Name))
            .ToListAsync();

        if (permissions.Count != normalizedNames.Count)
        {
            var foundNames = permissions.Select(p => p.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var missing = normalizedNames.Where(name => !foundNames.Contains(name));
            throw new NotFoundException($"Permissions not found: {string.Join(", ", missing)}");
        }

        var rolePermissions = await _context.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .ToListAsync();

        _context.RolePermissions.RemoveRange(rolePermissions);

        var newRolePermissions = permissions.Select(permission => new RolePermission
        {
            RoleId = roleId,
            PermissionId = permission.Id
        });

        await _context.RolePermissions.AddRangeAsync(newRolePermissions);
        await _context.SaveChangesAsync();
    }
}