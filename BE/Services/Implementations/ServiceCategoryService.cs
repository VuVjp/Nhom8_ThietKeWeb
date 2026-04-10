using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;

namespace HotelManagement.Services.Implementations;

public class ServiceCategoryService : IServiceCategoryService
{
    private readonly IServiceCategoryRepository _repository;

    public ServiceCategoryService(IServiceCategoryRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ServiceCategoryDto>> GetAllAsync()
    {
        var data = await _repository.GetAllAsync();
        return data.Select(c => new ServiceCategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            IsActive = c.IsActive
        });
    }

    public async Task<ServiceCategoryDto?> GetByIdAsync(int id)
    {
        var c = await _repository.GetByIdAsync(id);
        if (c == null) return null;
        return new ServiceCategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            IsActive = c.IsActive
        };
    }

    public async Task<bool> CreateAsync(CreateServiceCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return false;

        var category = new ServiceCategory
        {
            Name = dto.Name,
            IsActive = true
        };

        await _repository.AddAsync(category);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateAsync(int id, UpdateServiceCategoryDto dto)
    {
        var category = await _repository.GetByIdAsync(id);
        if (category == null) return false;

        category.Name = dto.Name;
        category.IsActive = dto.IsActive;

        _repository.Update(category);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _repository.GetByIdAsync(id);
        if (category == null) return false;

        category.IsActive = false;
        _repository.Update(category);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleActiveAsync(int id)
    {
        var category = await _repository.GetByIdAsync(id);
        if (category == null) return false;

        category.IsActive = !category.IsActive;
        _repository.Update(category);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreAsync(int id)
    {
        var category = await _repository.GetByIdAsync(id);
        if (category == null) return false;

        category.IsActive = true;
        _repository.Update(category);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<PaginatedResultDto<ServiceCategoryDto>> GetPagedAsync(ServiceCategoryQueryDto query)
    {
        var (items, total) = await _repository.GetPagedAsync(
            query.Search, query.SortBy, query.SortOrder, query.Page, query.PageSize, query.IsActive);

        return new PaginatedResultDto<ServiceCategoryDto>
        {
            Items = items.Select(c => new ServiceCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                IsActive = c.IsActive
            }).ToList(),
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }
}
