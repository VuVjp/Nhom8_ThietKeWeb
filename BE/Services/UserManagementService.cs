using HotelManagement.Dtos;
using HotelManagement.Entities;
using System.Security.Cryptography;
public class UserManagementService : IUserManagementService
{
    private readonly IUserManagementRepository _userManagementRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;

    public UserManagementService(IUserManagementRepository userManagementRepository, IRoleRepository roleRepository, IUserRepository userRepository, IEmailService emailService)
    {
        _userManagementRepository = userManagementRepository;
        _roleRepository = roleRepository;
        _userRepository = userRepository;
        _emailService = emailService;
    }

    private static string GenerateRandomPassword(int length = 12)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
        var bytes = new byte[length];
        RandomNumberGenerator.Fill(bytes);
        return new string(bytes.Select(b => chars[b % chars.Length]).ToArray());
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

        if (await _userRepository.IsEmailExistAsync(email))
        {
            throw new ConflictException("Email already exists.");
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

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _userManagementRepository.GetAllUsersAsync();
        return users.Select(u => new UserDto
        {
            Id = u.Id,
            Email = u.Email,
            RoleName = u.Role!.Name,
            IsActive = u.IsActive
        });
    }

    public async Task ToggleUserActiveByIdAsync(int userId)
    {
        var user = await _userManagementRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        await _userManagementRepository.ToggleUserActiveByIdAsync(userId);
    }

    public async Task ResetPasswordAndSendEmailAsync(int userId)
    {
        var user = await _userManagementRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        if (string.IsNullOrWhiteSpace(user.Email))
        {
            throw new InvalidOperationException("User email is missing.");
        }

        var newPassword = GenerateRandomPassword();
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        _userManagementRepository.Update(user);
        await _userManagementRepository.SaveChangesAsync();

        var body = $"<p>Hello {user.FullName},</p>"
            + "<p>Your account password has been reset by admin.</p>"
            + $"<p><strong>New password:</strong> {newPassword}</p>"
            + "<p>Please log in and change your password immediately.</p>";

        await _emailService.SendAsync(user.Email, "Your new account password", body);
    }
}