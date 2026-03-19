public class UserManagementService : IUserManagementService
{
    private readonly IUserManagementRepository _userManagementRepository;
    private readonly IRoleRepository _roleRepository;

    public UserManagementService(IUserManagementRepository userManagementRepository, IRoleRepository roleRepository)
    {
        _userManagementRepository = userManagementRepository;
        _roleRepository = roleRepository;
    }

    public async Task ChangeRoleByIdAsync(int userId, int roleId)
    {
        await _userManagementRepository.ChangeRoleByIdAsync(userId, roleId);
    }

    public Task CreateUserAsync(string email, string password, int roleId)
    {
        throw new NotImplementedException();
    }

    public Task EditUserAsync(int userId, string email, string password, int roleId)
    {
        throw new NotImplementedException();
    }

    public Task GetAllUsersAsync(int roleId, int permissionId)
    {
        throw new NotImplementedException();
    }

    public Task SoftDeleteUserByIdAsync(int userId)
    {
        throw new NotImplementedException();
    }
}