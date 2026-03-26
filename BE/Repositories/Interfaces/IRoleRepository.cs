using HotelManagement.Dtos;
using HotelManagement.Entities;

public interface IRoleRepository : IRepository<Role>
{
    Task<List<RoleResponseDto>> GetAllRolesAsync();
    Task<bool> IsRoleExistAsync(int id);  
    Task AssignPermissionAsync(int roleId, int permissionId);
    Task<List<string>> GetMyPermissionsAsync(int userId);
}