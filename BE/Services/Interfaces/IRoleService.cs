using HotelManagement.Dtos;

public interface IRoleService
{
    Task<List<RoleResponseDto>> GetAllRolesAsync();
    Task AssignPermissionAsync(int roleId, int permissionId);
    Task<List<string>> GetMyPermissionsAsync(int userId);
    Task<List<string>> GetAllPermissionNamesAsync();
    Task UpdateRolePermissionsAsync(int roleId, IEnumerable<string> permissionNames);
}