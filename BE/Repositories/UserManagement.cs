using HotelManagement.Data;
using HotelManagement.Entities;

public class UserManagement : Repository<User>, IUserManagementRepository
{
    public UserManagement(AppDbContext context) : base(context)
    {
    }

    public async Task ChangeRoleByIdAsync(int userId, int roleId)
    {
        var user = await GetByIdAsync(userId);
        if (user != null)
        {
            user.RoleId = roleId;
            await SaveChangesAsync();
        }
    }
}