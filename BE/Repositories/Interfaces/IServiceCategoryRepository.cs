using HotelManagement.Entities;

namespace HotelManagement.Repositories.Interfaces;

public interface IServiceCategoryRepository : IRepository<ServiceCategory>
{
    Task<IEnumerable<ServiceCategory>> GetAllAsync();
    Task<ServiceCategory?> GetByIdAsync(int id);
    Task<bool> HasServicesAsync(int categoryId);
    Task<(IEnumerable<ServiceCategory> Items, int Total)> GetPagedAsync(
        string? search, string? sortBy, string? sortOrder, int page, int pageSize, bool? isActive = null);
}
