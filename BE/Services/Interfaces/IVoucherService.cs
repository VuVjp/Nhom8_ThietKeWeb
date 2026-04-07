using HotelManagement.Dtos;

public interface IVoucherService
{
    Task<IEnumerable<VoucherDto>> GetAllAsync();
    Task<VoucherDto?> GetByIdAsync(int id);
    Task<bool> CreateAsync(CreateVoucherDto dto);
    Task<bool> UpdateAsync(int id, UpdateVoucherDto dto);
    Task<bool> ToggleActiveAsync(int id);
}