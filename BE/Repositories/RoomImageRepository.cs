using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

public class RoomImageRepository : Repository<RoomImage>, IRoomImageRepository
{
    public RoomImageRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<RoomImage>> GetImagesByRoomTypeIdAsync(int roomTypeId)
    {
        return await _dbSet
            .Where(x => x.RoomTypeId == roomTypeId)
            .ToListAsync();
    }
}