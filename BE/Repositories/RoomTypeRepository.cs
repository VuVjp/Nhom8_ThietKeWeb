using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

public class RoomTypeRepository : Repository<RoomType>, IRoomTypeRepository
{
    public RoomTypeRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<RoomType?> GetRoomTypeWithImagesAsync(int id)
    {
        return await _dbSet
            .Include(r => r.RoomImages)
            .FirstOrDefaultAsync(r => r.Id == id);
    }
}
