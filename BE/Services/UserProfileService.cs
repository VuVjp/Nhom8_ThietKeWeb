using HotelManagement.Dtos;
using HotelManagement.Entities;

public class UserProfileService : IUserProfileService
{
    private readonly IUserRepository _userRepository;
    private readonly ICloudinaryService _cloudinaryService;

    public UserProfileService(IUserRepository userRepository, ICloudinaryService cloudinaryService)
    {
        _userRepository = userRepository;
        _cloudinaryService = cloudinaryService;
    }

    public async Task<UserDto?> GetProfileByEmailAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            RoleName = user.Role?.Name ?? string.Empty,
            IsActive = user.IsActive,
            AvatarUrl = user.AvatarUrl,
            Birthday = user.Birthday,
            BirthdayUpdateCount = user.BirthdayUpdateCount
        };
    }

    public async Task<UserDto?> UpdateProfileAsync(string email, UpdateProfileDto updateProfileDto)
    {
        var user = await _userRepository.GetByEmailAsync(email);

        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        if (updateProfileDto.Birthday.HasValue && user.Birthday != updateProfileDto.Birthday)
        {
            // Limit birthday updates (default: 1)
            if (user.BirthdayUpdateCount >= 1)
            {
                throw new BadRequestException("Birthday can only be updated once.");
            }

            var now = DateTime.UtcNow;
            var newBirthday = updateProfileDto.Birthday.Value;
            var currentYear = now.Year;

            // Anti-abuse: if birthday already passed this year OR updated < 7 days before birthday
            // Use safe way to handle February 29th
            DateTime birthdayThisYear;
            try
            {
                birthdayThisYear = new DateTime(currentYear, newBirthday.Month, newBirthday.Day);
            }
            catch (ArgumentOutOfRangeException)
            {
                // If Leap Year Birthday and current year is not leap year, use Feb 28th or March 1st
                birthdayThisYear = new DateTime(currentYear, 3, 1);
            }

            if (birthdayThisYear < now.Date || (birthdayThisYear - now.Date).TotalDays < 7)
            {
                user.LastBirthdayVoucherYear = currentYear;
            }

            user.Birthday = newBirthday;
            user.BirthdayUpdatedAt = now;
            user.BirthdayUpdateCount++;
        }

        user.FullName = updateProfileDto.FullName ?? user.FullName;
        user.Phone = updateProfileDto.Phone ?? user.Phone;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            AvatarUrl = user.AvatarUrl,
            Birthday = user.Birthday,
            BirthdayUpdateCount = user.BirthdayUpdateCount
        };
    }

    public async Task<UserDto?> ChangePasswordAsync(string email, string newPassword, string currentPassword)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }
        if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
        {
            throw new ForbiddenException("Current password is incorrect.");
        }
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            RoleName = user.Role?.Name ?? string.Empty,
            IsActive = user.IsActive,
            AvatarUrl = user.AvatarUrl
        };
    }

    public async Task<UserDto?> UploadAvatarAsync(string email, IFormFile? avatarFile, string? avatarUrl)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        if (avatarFile != null)
        {
            avatarUrl = await _cloudinaryService.UploadImageAsync(avatarFile, "users/avatar", user.Id.ToString());
        }

        if (string.IsNullOrWhiteSpace(avatarUrl))
        {
            throw new Exception("Avatar file or avatar URL is required.");
        }

        user.AvatarUrl = avatarUrl;
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();
        return new UserDto
        {
            AvatarUrl = avatarUrl
        };
    }
}