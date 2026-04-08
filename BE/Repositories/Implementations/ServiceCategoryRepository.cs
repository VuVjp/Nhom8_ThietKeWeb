using HotelManagement.Data;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Repositories.Implementations;

public class ServiceCategoryRepository : Repository<ServiceCategory>, IServiceCategoryRepository
{
    public ServiceCategoryRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ServiceCategory>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<ServiceCategory?> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<bool> HasServicesAsync(int categoryId)
    {
        return await _context.Services.AnyAsync(s => s.CategoryId == categoryId);
    }
}
