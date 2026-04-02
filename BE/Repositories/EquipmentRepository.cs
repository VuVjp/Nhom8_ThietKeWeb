using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

public class EquipmentRepository : Repository<Equipment>, IEquipmentRepository
{
    public EquipmentRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Equipment>> GetAllActiveAsync()
    {
        return await _dbSet
            .Where(e => e.IsActive)
            .OrderBy(e => e.Name)
            .ToListAsync();
    }

    public async Task<Equipment?> GetByItemCodeAsync(string itemCode)
    {
        return await _dbSet.FirstOrDefaultAsync(e => e.ItemCode == itemCode);
    }

    public async Task<Equipment?> GetByNameNormalizedAsync(string name)
    {
        var normalized = name.Trim().ToLower();

        return await _dbSet.FirstOrDefaultAsync(e => e.Name.Trim().ToLower() == normalized);
    }
}
