using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;

namespace HotelManagement.Services.Implementations;

public class ServiceService : IServiceService
{
    private readonly IServiceRepository _repository;

    public ServiceService(IServiceRepository repository)
    {
        _repository = repository;
    }

    public async Task<PaginatedResultDto<ServiceDto>> GetPagedAsync(ServiceQueryDto query)
    {
        var (items, total) = await _repository.GetPagedAsync(
            query.Search, query.CategoryId, query.SortBy, query.SortOrder, query.Page, query.PageSize, query.IsActive);

        return new PaginatedResultDto<ServiceDto>
        {
            Items = items.Select(s => new ServiceDto
            {
                Id = s.Id,
                CategoryId = s.CategoryId,
                CategoryName = s.Category?.Name ?? string.Empty,
                Name = s.Name,
                Price = s.Price,
                Unit = s.Unit,
                IsActive = s.IsActive
            }).ToList(),
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<ServiceDto?> GetByIdAsync(int id)
    {
        var s = await _repository.GetByIdWithCategoryAsync(id);
        if (s == null) return null;
        return new ServiceDto
        {
            Id = s.Id,
            CategoryId = s.CategoryId,
            CategoryName = s.Category?.Name ?? string.Empty,
            Name = s.Name,
            Price = s.Price,
            Unit = s.Unit,
            IsActive = s.IsActive
        };
    }

    public async Task<bool> CreateAsync(CreateServiceDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new ArgumentException("Name is required.");
        if (dto.Price <= 0) throw new ArgumentException("Price must be greater than 0.");
        if (string.IsNullOrWhiteSpace(dto.Unit)) throw new ArgumentException("Unit is required.");

        var service = new Service
        {
            CategoryId = dto.CategoryId,
            Name = dto.Name,
            Price = dto.Price,
            Unit = dto.Unit,
            IsActive = true
        };

        await _repository.AddAsync(service);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateAsync(int id, UpdateServiceDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new ArgumentException("Name is required.");
        if (dto.Price <= 0) throw new ArgumentException("Price must be greater than 0.");
        if (string.IsNullOrWhiteSpace(dto.Unit)) throw new ArgumentException("Unit is required.");

        var service = await _repository.GetByIdAsync(id);
        if (service == null) return false;

        service.CategoryId = dto.CategoryId;
        service.Name = dto.Name;
        service.Price = dto.Price;
        service.Unit = dto.Unit;
        service.IsActive = dto.IsActive;

        _repository.Update(service);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var service = await _repository.GetByIdAsync(id);
        if (service == null) return false;

        service.IsActive = false;
        _repository.Update(service);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleActiveAsync(int id)
    {
        var service = await _repository.GetByIdAsync(id);
        if (service == null) return false;

        service.IsActive = !service.IsActive;
        _repository.Update(service);
        await _repository.SaveChangesAsync();
        return true;
    }
}
