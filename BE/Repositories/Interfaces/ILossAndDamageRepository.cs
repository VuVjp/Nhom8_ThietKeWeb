using HotelManagement.Entities;

namespace HotelManagement.Repositories.Interfaces;

public interface ILossAndDamageRepository
{
    Task<IEnumerable<LossAndDamage>> GetAllAsync();
    Task<IEnumerable<LossAndDamage>> GetByRoomIdAsync(int roomId);
    Task<LossAndDamage?> GetByIdAsync(int id);
    Task AddAsync(LossAndDamage entity);
    void Update(LossAndDamage entity);
    Task<bool> SaveChangesAsync();
}