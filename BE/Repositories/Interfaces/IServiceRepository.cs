using HotelManagement.Entities;

namespace HotelManagement.Repositories.Interfaces;

public interface IServiceRepository : IRepository<Service>
{
    Task<(IEnumerable<Service> Items, int Total)> GetPagedAsync(
        string? search, int? categoryId, string? sortBy, string? sortOrder, int page, int pageSize, bool? isActive = null);
    Task<Service?> GetByIdWithCategoryAsync(int id);
}
