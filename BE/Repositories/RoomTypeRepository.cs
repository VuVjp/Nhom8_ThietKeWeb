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

    public async Task<IEnumerable<RoomType>> GetAllActiveWithImagesAndAmenitiesAsync()
    {
        return await _dbSet
            .Where(x => x.IsActive)
            .Include(r => r.RoomImages)
            .Include(r => r.RoomTypeAmenities)
                .ThenInclude(rta => rta.Amenity)
            .Include(r => r.Rooms)
                .ThenInclude(rm => rm.RoomInventories)
                    .ThenInclude(ri => ri.Equipment)
            .ToListAsync();
    }

    public async Task<IEnumerable<RoomType>> GetAllWithImagesAndAmenitiesAsync()
    {
        return await _dbSet
            .Include(r => r.RoomImages)
            .Include(r => r.RoomTypeAmenities)
                .ThenInclude(rta => rta.Amenity)
            .Include(r => r.Rooms)
                .ThenInclude(rm => rm.RoomInventories)
                    .ThenInclude(ri => ri.Equipment)
            .ToListAsync();
    }

    public async Task<RoomType?> GetByIdWithImagesAndAmenitiesAsync(int id)
    {
        return await _dbSet
            .Include(r => r.RoomImages)
            .Include(r => r.RoomTypeAmenities)
                .ThenInclude(rta => rta.Amenity)
            .Include(r => r.Rooms)
                .ThenInclude(rm => rm.RoomInventories)
                    .ThenInclude(ri => ri.Equipment)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<bool> AddAmenityAsync(int roomTypeId, int amenityId)
    {
        var roomType = await _context.RoomTypes.AnyAsync(rt => rt.Id == roomTypeId && rt.IsActive);
        var amenity = await _context.Amenities.AnyAsync(a => a.Id == amenityId && a.IsActive);

        if (!roomType || !amenity)
        {
            return false;
        }

        var exists = await _context.RoomTypeAmenities
            .AnyAsync(x => x.RoomTypeId == roomTypeId && x.AmenityId == amenityId);

        if (exists)
        {
            return true;
        }

        await _context.RoomTypeAmenities.AddAsync(new RoomTypeAmenity
        {
            RoomTypeId = roomTypeId,
            AmenityId = amenityId
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AddAmenitiesAsync(int roomTypeId, IEnumerable<int> amenityIds)
    {
        var ids = amenityIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return true;
        }

        var roomTypeExists = await _context.RoomTypes.AnyAsync(rt => rt.Id == roomTypeId && rt.IsActive);
        if (!roomTypeExists)
        {
            return false;
        }

        var validAmenityIds = await _context.Amenities
            .Where(a => a.IsActive && ids.Contains(a.Id))
            .Select(a => a.Id)
            .ToListAsync();

        if (validAmenityIds.Count != ids.Count)
        {
            return false;
        }

        var existingPairs = await _context.RoomTypeAmenities
            .Where(x => x.RoomTypeId == roomTypeId && ids.Contains(x.AmenityId))
            .Select(x => x.AmenityId)
            .ToListAsync();

        var newPairs = ids
            .Where(id => !existingPairs.Contains(id))
            .Select(amenityId => new RoomTypeAmenity
            {
                RoomTypeId = roomTypeId,
                AmenityId = amenityId
            });

        if (newPairs.Any())
        {
            await _context.RoomTypeAmenities.AddRangeAsync(newPairs);
            await _context.SaveChangesAsync();
        }

        return true;
    }

    public async Task<bool> RemoveAmenityAsync(int roomTypeId, int amenityId)
    {
        var item = await _context.RoomTypeAmenities
            .FirstOrDefaultAsync(x => x.RoomTypeId == roomTypeId && x.AmenityId == amenityId);

        if (item == null)
        {
            return false;
        }

        _context.RoomTypeAmenities.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }
}
