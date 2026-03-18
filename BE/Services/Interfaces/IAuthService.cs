using HotelManagement.Entities;

namespace Services.Interfaces;

public interface IAuthService
{
    Task<(int, string, string)> RegisterAsync(string email, string fullName, string password);
    Task<(string, string)> LoginAsync(string email, string password);
    Task LogoutAsync(string refreshToken);
    Task<(string, string)> AuthenticateGoogleAsync(string idToken);
    Task<(string, string)> RefreshTokenAsync(string refreshToken);
    Task<string> GenerateRefreshTokenAsync(User user);
}
