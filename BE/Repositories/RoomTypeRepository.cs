using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

public class RoomTypeRepository : Repository<RoomType>, IRoomTypeRepository
{
    public RoomTypeRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<RoomType>> GetAllActiveWithImagesAsync()
{
    return await _dbSet
        .Where(x => x.IsActive)
        .Include(r => r.RoomImages)
        .ToListAsync();
}
}
