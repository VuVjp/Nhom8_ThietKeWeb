using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

class RefreshTokenRepository : Repository<RefreshToken>, IRefreshTokenRepository
{
    public RefreshTokenRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        return await _dbSet.FirstOrDefaultAsync(rt => rt.Token == token);
    }

    public async Task AddRefreshTokenAsync(RefreshToken refreshToken)
    {
        _dbSet.Add(new RefreshToken
        {
            Token = refreshToken.Token,
            UserId = refreshToken.UserId,
            ExpiryDate = DateTime.UtcNow.AddDays(7)
        });

        await SaveChangesAsync();

    }

    public async Task RevokeTokenAsync(string token)
    {
        var refreshToken = await GetByTokenAsync(token);
        if (refreshToken != null)
        {
            refreshToken.IsRevoked = true;
            await SaveChangesAsync();
        }
    }
}