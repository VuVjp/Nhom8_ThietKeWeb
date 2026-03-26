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
        return await _roleRepository.GetMyPermissionsAsync(userId);
    }
}