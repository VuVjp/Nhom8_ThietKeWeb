using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Repositories.Interfaces;

public interface IRoomInventoryRepository
{
	Task<IEnumerable<RoomInventory>> GetAllAsync();
	Task<IEnumerable<RoomInventory>> GetByRoomIdAsync(int roomId);
	Task<RoomInventory?> GetByIdAsync(int id);
	Task<RoomInventory?> GetActiveByRoomAndItemNameAsync(int roomId, string itemName, int? excludeId = null);
	Task AddAsync(RoomInventory inventory);
	void Update(RoomInventory inventory);
	void Delete(RoomInventory inventory);
	Task<bool> SaveChangesAsync();
}