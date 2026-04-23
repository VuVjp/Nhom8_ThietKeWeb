using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using System.Security.Cryptography;
public class UserManagementService : IUserManagementService
{
    private readonly IUserManagementRepository _userManagementRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;
    private readonly IMembershipRepository _membershipRepository;

    public UserManagementService(IUserManagementRepository userManagementRepository, IRoleRepository roleRepository, IUserRepository userRepository, IEmailService emailService, IMembershipRepository membershipRepository)
    {
        _userManagementRepository = userManagementRepository;
        _roleRepository = roleRepository;
        _userRepository = userRepository;
        _emailService = emailService;
        _membershipRepository = membershipRepository;
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

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);
        var user = new User
        {
            Email = email,
            PasswordHash = passwordHash,
            RoleId = roleId,
            IsActive = true
        };
        await _userManagementRepository.AddAsync(user);

        await _userManagementRepository.SaveChangesAsync();

        var body = $"<p>Hello {user.FullName},</p>"
            + "<p>Welcome to our platform!</p>"
            + $"<p><strong>Your password:</strong> {passwordHash}</p>"
            + "<p></p>";

        await _emailService.SendAsync(user.Email, "Your new account password", body);
    }

    public async Task<validateUserResponseDto> ValidateUserAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }
        if (!user.IsActive)
        {
            throw new InvalidOperationException("User account is inactive.");
        }
        return new validateUserResponseDto
        {
            FullName = user.FullName,
            Phone = user.Phone,
            Email = user.Email,
            MembershipTierName = user.Membership?.TierName ?? "Normal",
            DiscountPercent = user.Membership?.DiscountPercent ?? 0
        };
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

    public async Task AddLoyaltyPointsAsync(int userId, decimal amountPaid)
    {
        if (amountPaid <= 0) return;

        var user = await _userManagementRepository.GetByIdAsync(userId);
        if (user == null || !user.IsActive) return;

        int pointsEarned = (int)Math.Floor(amountPaid / 1000m); // 1 point per 1,000 VND paid
        if (pointsEarned <= 0) return;

        user.LoyaltyPoints += pointsEarned;

        var allTiers = await _membershipRepository.GetAllAsync();
        var matchingTier = allTiers
            .Where(m => m.IsActive && m.MinPoints <= user.LoyaltyPoints)
            .OrderByDescending(m => m.MinPoints)
            .FirstOrDefault();

        if (matchingTier != null && user.MembershipId != matchingTier.Id)
        {
            user.MembershipId = matchingTier.Id;
        }

        _userManagementRepository.Update(user);
        await _userManagementRepository.SaveChangesAsync();
    }
}