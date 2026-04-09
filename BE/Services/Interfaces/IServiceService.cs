using HotelManagement.Dtos;

namespace HotelManagement.Services.Interfaces;

public interface IServiceService
{
    Task<PaginatedResultDto<ServiceDto>> GetPagedAsync(ServiceQueryDto query);
    Task<ServiceDto?> GetByIdAsync(int id);
    Task<bool> CreateAsync(CreateServiceDto dto);
    Task<bool> UpdateAsync(int id, UpdateServiceDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> ToggleActiveAsync(int id);
    Task<bool> RestoreAsync(int id);
}
