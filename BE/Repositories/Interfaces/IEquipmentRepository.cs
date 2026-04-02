using HotelManagement.Entities;

public interface IEquipmentRepository : IRepository<Equipment>
{
    Task<IEnumerable<Equipment>> GetAllActiveAsync();
    Task<Equipment?> GetByItemCodeAsync(string itemCode);
}
