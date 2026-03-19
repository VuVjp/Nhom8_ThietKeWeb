using HotelManagement.Entities;

public interface IRoleRepository : IRepository<Role>
{
    Task AssignPermissionAsync(int roleId, int permissionId);
    Task<List<string>> GetMyPermissionsAsync(int userId);
}