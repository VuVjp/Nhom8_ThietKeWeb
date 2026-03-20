using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Services.Interfaces;

public interface IRoomService
{
	Task<IEnumerable<Room>> GetListAsync();
	Task<Room?> GetDetailAsync(int id);
	Task<bool> CreateRoomAsync(Room room);
	Task<bool> UpdateRoomAsync(int id, Room room);
	Task<bool> DeleteRoomAsync(int id);
}