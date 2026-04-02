using HotelManagement.Data;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Repositories.Implementations;

public class LossAndDamageRepository : ILossAndDamageRepository
{
    private readonly AppDbContext _context;

    public LossAndDamageRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<LossAndDamage>> GetAllAsync()
        => await _context.LossAndDamages
            .Include(x => x.RoomInventory)
            .ThenInclude(x => x.Room)
            .AsNoTracking()
            .ToListAsync();

    public async Task<IEnumerable<LossAndDamage>> GetByRoomIdAsync(int roomId)
        => await _context.LossAndDamages
            .Include(x => x.RoomInventory)
            .ThenInclude(x => x.Room)
            .Where(x => x.RoomInventory != null && x.RoomInventory.RoomId == roomId)
            .AsNoTracking()
            .ToListAsync();

    public async Task<LossAndDamage?> GetByIdAsync(int id)
        => await _context.LossAndDamages
            .Include(x => x.RoomInventory)
            .ThenInclude(x => x.Room)
            .FirstOrDefaultAsync(x => x.Id == id);

    public async Task AddAsync(LossAndDamage entity)
        => await _context.LossAndDamages.AddAsync(entity);

    public void Update(LossAndDamage entity)
        => _context.LossAndDamages.Update(entity);

    public async Task<bool> SaveChangesAsync()
        => await _context.SaveChangesAsync() > 0;
}