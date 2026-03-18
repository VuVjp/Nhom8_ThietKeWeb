using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Google.Apis.Auth;
using Microsoft.IdentityModel.Tokens;
using HotelManagement.Entities;
using Services.Interfaces;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    public async Task<(int, string, string)> RegisterAsync(string email, string fullName, string password)
    {
        if (await _userRepository.GetByEmailAsync(email) != null)
        {
            throw new ConflictException("Email already exists");
        }

        var user = new User
        {
            Email = email,
            FullName = fullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = new Role { Name = "Customer" }
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        return (user.Id, user.Email, user.Role.Name);
    }

    public async Task<(string, string)> LoginAsync(string email, string password)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }
        if (user.IsLocked)
        {
            throw new UnauthorizedException("User account is locked");
        }

        var jwtToken = GenerateJwt(user);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id);


        return (jwtToken, refreshToken);
    }

    public async Task<(string, string)> AuthenticateGoogleAsync(string idToken)
    {
        var payload = await GoogleJsonWebSignature.ValidateAsync(idToken);
        var email = payload.Email;
        var name = payload.Name ?? payload.FamilyName ?? payload.GivenName ?? "Google User";
        var googleId = payload.Subject;

        var user = await _userRepository.GetByGoogleIdAsync(googleId);
        var alreadyExistsEmail = await _userRepository.GetByEmailAsync(email);

        if (alreadyExistsEmail != null && user == null)
        {
            throw new ConflictException("Email already exists with a different authentication method");
        }

        if (user == null)
        {
            user = new User
            {
                Email = email,
                FullName = name,
                GoogleId = googleId,
                Role = new Role { Name = "Customer" }
            };
            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();
        }

        var jwtToken = GenerateJwt(user);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id);

        return (jwtToken, refreshToken);
    }

    public async Task<(string, string)> RefreshTokenAsync(string refreshToken)
    {
        var user = await _userRepository.GetAllAsync();

        Console.WriteLine($"{user.Count()} users found in database for refresh token validation.");
        var matchedUser = user.FirstOrDefault(u => u.RefreshTokens.Any(rt => rt.Token == refreshToken && rt.ExpiryDate > DateTime.UtcNow));

        if (matchedUser == null)
        {
            throw new UnauthorizedException("Invalid refresh token");
        }

        var rfToken = matchedUser.RefreshTokens.First(rt => rt.Token == refreshToken);
        if (rfToken.IsRevoked)
        {
            throw new UnauthorizedException("Refresh token has been revoked");
        }

        rfToken.IsRevoked = true;

        var newJwt = GenerateJwt(matchedUser);
        var newRefreshToken = await GenerateRefreshTokenAsync(matchedUser.Id);

        await _userRepository.SaveChangesAsync();

        return (newJwt, newRefreshToken);
    }

    public async Task<string> GenerateRefreshTokenAsync(int userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new UnauthorizedException("User not found");
        }

        var rfToken = GenerateRefreshToken();
        user.RefreshTokens.Add(new RefreshToken
        {
            Token = rfToken,
            ExpiryDate = DateTime.UtcNow.AddDays(7)
        });

        await _userRepository.SaveChangesAsync();

        return rfToken;
    }
    private string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        RandomNumberGenerator.Fill(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    private string GenerateJwt(User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role?.Name ?? "Customer")
            };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.Now.AddHours(2),
            audience: jwtSettings["Audience"],
            issuer: jwtSettings["Issuer"],
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}