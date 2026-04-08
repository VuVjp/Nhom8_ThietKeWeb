using HotelManagement.Data;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Repositories.Implementations;

public class ServiceRepository : Repository<Service>, IServiceRepository
{
    public ServiceRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<Service> Items, int Total)> GetPagedAsync(
        string? search, int? categoryId, string? sortBy, string? sortOrder, int page, int pageSize, bool? isActive = null)
    {
        var query = _dbSet.Include(s => s.Category).AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(s => s.Name.Contains(search));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(s => s.CategoryId == categoryId);
        }

        // Sorting
        bool ascending = (sortOrder?.ToLower() != "desc");
        switch (sortBy?.ToLower())
        {
            case "price":
                query = ascending ? query.OrderBy(s => s.Price) : query.OrderByDescending(s => s.Price);
                break;
            case "id":
                query = ascending ? query.OrderBy(s => s.Id) : query.OrderByDescending(s => s.Id);
                break;
            case "name":
                query = ascending ? query.OrderBy(s => s.Name) : query.OrderByDescending(s => s.Name);
                break;
            default:
                query = query.OrderBy(s => s.Id);
                break;
        }

        int total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize)
                              .Take(pageSize)
                              .ToListAsync();

        return (items, total);
    }

    public async Task<Service?> GetByIdWithCategoryAsync(int id)
    {
        return await _dbSet.Include(s => s.Category)
                           .FirstOrDefaultAsync(s => s.Id == id);
    }
}
