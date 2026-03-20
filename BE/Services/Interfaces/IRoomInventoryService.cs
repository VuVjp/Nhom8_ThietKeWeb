using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Services.Interfaces;

public interface IRoomInventoryService
{
	Task<IEnumerable<RoomInventoryDto>> GetInventoriesAsync();
	Task<IEnumerable<RoomInventoryDto>> GetByRoomAsync(int roomId);
	Task<RoomInventoryDto?> GetByIdAsync(int id);
	Task<bool> AddItemAsync(CreateRoomInventoryDto dto);
	Task CloneItemAsync(int idClone, int newRoomId);
	Task<bool> UpdateItemAsync(int id, UpdateRoomInventoryDto dto);
	Task<bool> RemoveItemAsync(int id);
}