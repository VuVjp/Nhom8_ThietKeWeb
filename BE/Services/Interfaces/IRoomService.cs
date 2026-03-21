using HotelManagement.Dtos;
using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Services.Interfaces;

public interface IRoomService
{
	Task<IEnumerable<RoomDto>> GetListAsync();
	Task<RoomDto?> GetDetailAsync(int id);
	Task<bool> CreateRoomAsync(RoomDto room);
	Task<bool> UpdateRoomAsync(int id, RoomDto room);
	Task<bool> DeleteRoomAsync(int id);
	Task ChangeRoomStatusAsync(int id, string newStatus);
	Task ChangeRoomCleaningStatusAsync(int id, string newCleaningStatus);
}