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

    public async Task<(IEnumerable<ServiceCategory> Items, int Total)> GetPagedAsync(
        string? search, string? sortBy, string? sortOrder, int page, int pageSize, bool? isActive = null)
    {
        var query = _dbSet.AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(c => c.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            if (int.TryParse(search, out int id))
            {
                query = query.Where(c => c.Id == id || c.Name.Contains(search));
            }
            else
            {
                query = query.Where(c => c.Name.Contains(search));
            }
        }

        // Sorting
        bool ascending = (sortOrder?.ToLower() != "desc");
        switch (sortBy?.ToLower())
        {
            case "name":
                query = ascending ? query.OrderBy(c => c.Name) : query.OrderByDescending(c => c.Name);
                break;
            case "id":
            default:
                query = ascending ? query.OrderBy(c => c.Id) : query.OrderByDescending(c => c.Id);
                break;
        }

        int total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize)
                              .Take(pageSize)
                              .ToListAsync();

        return (items, total);
    }
}
