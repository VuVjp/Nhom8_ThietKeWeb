public interface IRoleService
{
    Task AssignPermissionAsync(int roleId, int permissionId);
    Task<List<string>> GetMyPermissionsAsync(int userId);
}