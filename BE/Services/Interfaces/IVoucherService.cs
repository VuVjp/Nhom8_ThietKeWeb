using HotelManagement.Dtos;

namespace HotelManagement.Services.Interfaces;

public interface IVoucherService
{
    Task<IEnumerable<VoucherDto>> GetAllAsync();
    Task<VoucherDto?> GetByIdAsync(int id);
    Task<bool> CreateAsync(CreateVoucherDto dto);
    Task<bool> UpdateAsync(int id, UpdateVoucherDto dto);
    Task<bool> ToggleActiveAsync(int id);
    Task ValidateCodeAsync(string code);
}