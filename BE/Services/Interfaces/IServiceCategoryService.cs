using HotelManagement.Dtos;

namespace HotelManagement.Services.Interfaces;

public interface IServiceCategoryService
{
    Task<IEnumerable<ServiceCategoryDto>> GetAllAsync();
    Task<ServiceCategoryDto?> GetByIdAsync(int id);
    Task<bool> CreateAsync(CreateServiceCategoryDto dto);
    Task<bool> UpdateAsync(int id, UpdateServiceCategoryDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> ToggleActiveAsync(int id);
    Task<bool> RestoreAsync(int id);
    Task<PaginatedResultDto<ServiceCategoryDto>> GetPagedAsync(ServiceCategoryQueryDto query);
}
