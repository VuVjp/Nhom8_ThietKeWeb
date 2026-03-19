using HotelManagement.Entities;
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
        if (!await _roleRepository.IsRoleExistAsync(roleId))
        {
            throw new ArgumentException("Role does not exist.");
        }

        await _userManagementRepository.ChangeRoleByIdAsync(userId, roleId);
    }

    public async Task CreateUserAsync(string email, string password, int roleId)
    {
        if (!await _roleRepository.IsRoleExistAsync(roleId))
        {
            throw new NotFoundException("Role does not exist.");
        }

        await _userManagementRepository.AddAsync(new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            RoleId = roleId
        });

        await _userManagementRepository.SaveChangesAsync();
    }

    public async Task EditUserAsync(int userId, string email, string password, int roleId)
    {
        if (!await _roleRepository.IsRoleExistAsync(roleId))
        {
            throw new NotFoundException("Role does not exist.");
        }

        var user = await _userManagementRepository.GetByIdAsync(userId);

        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        user.Email = email;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        user.RoleId = roleId;

        _userManagementRepository.Update(user);
        await _userManagementRepository.SaveChangesAsync();
    }

    public async Task<IEnumerable<User>> GetAllUsersAsync()
    {
        return await _userManagementRepository.GetAllAsync();
    }

    public async Task SoftDeleteUserByIdAsync(int userId)
    {
        await _userManagementRepository.SoftDeleteUserByIdAsync(userId);
    }
}