using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

public class AmenityRepository : Repository<Amenity>, IAmenityRepository
{
    public AmenityRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Amenity>> GetAllActiveAsync()
    {
        return await _dbSet
            .Where(a => a.IsActive)
            .ToListAsync();
    }
}