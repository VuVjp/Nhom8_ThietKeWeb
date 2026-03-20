using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Services.Interfaces;

public interface IRoomInventoryService
{
	Task<IEnumerable<RoomInventory>> GetInventoriesAsync();
	Task<IEnumerable<RoomInventory>> GetByRoomAsync(int roomId);
	Task<RoomInventory?> GetByIdAsync(int id);
	Task<bool> AddItemAsync(RoomInventory inventory);
	Task CloneItemAsync(int idClone, int newRoomId);
	Task<bool> UpdateItemAsync(int id, RoomInventory inventory);
	Task<bool> RemoveItemAsync(int id);
}