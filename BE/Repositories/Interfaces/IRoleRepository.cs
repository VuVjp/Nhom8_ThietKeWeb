using HotelManagement.Entities;

public interface IRoleRepository : IRepository<Role>
{
    Task AssignRoleAsync(int userId, int roleId);
    Task<List<string>> GetMyPermissionsAsync(int userId);
}