using HotelManagement.Dtos;

namespace HotelManagement.Services.Interfaces;

public interface ILossAndDamageService
{
    Task<IEnumerable<LossAndDamageDto>> GetAllAsync();
    Task<IEnumerable<LossAndDamageDto>> GetByRoomAsync(int roomId);
    Task<bool> CreateAsync(CreateLossAndDamageDto dto);
}