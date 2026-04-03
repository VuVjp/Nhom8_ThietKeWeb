using HotelManagement.Dtos;

public interface IEquipmentService
{
    Task<IEnumerable<EquipmentDto>> GetAllAsync();
    Task<EquipmentDto?> GetByIdAsync(int id);
    Task<bool> CreateAsync(CreateEquipmentDto dto);
    Task<bool> UpdateAsync(int id, UpdateEquipmentDto dto);
    Task<bool> ToggleActiveAsync(int id);
}
