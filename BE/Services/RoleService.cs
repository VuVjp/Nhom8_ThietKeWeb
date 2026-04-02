using HotelManagement.Dtos;

public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;

    public RoleService(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<List<RoleResponseDto>> GetAllRolesAsync()
    {
        return await _roleRepository.GetAllRolesAsync();
    }

    public async Task AssignPermissionAsync(int roleId, int permissionId)
    {
        await _roleRepository.AssignPermissionAsync(roleId, permissionId);
    }

    public async Task<List<string>> GetMyPermissionsAsync(int userId)
    {
        var rawPermissions = await _roleRepository.GetMyPermissionsAsync(userId);
        return PermissionNameMapper.NormalizeMany(rawPermissions);
    }

    public async Task<List<string>> GetAllPermissionNamesAsync()
    {
        var rawPermissions = await _roleRepository.GetAllPermissionNamesAsync();
        return PermissionNameMapper.NormalizeMany(rawPermissions);
    }

    public async Task UpdateRolePermissionsAsync(int roleId, IEnumerable<string> permissionNames)
    {
        await _roleRepository.UpdateRolePermissionsAsync(roleId, permissionNames);
    }
}