using HotelManagement.Dtos;
using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Services.Interfaces;

public interface IRoomService
{
	Task<IEnumerable<RoomDto>> GetListAsync();
	Task<IEnumerable<RoomDto>> GetByStatusAsync(string status, bool includeCleaningRequested = false);
	Task<IEnumerable<RoomDto>> GetByCleaningStatusAsync(string cleaningStatus);
	Task<RoomDto?> GetDetailAsync(int id);
	Task<bool> CreateRoomAsync(RoomDto room);
	Task<int> CreateRoomsBulkAsync(IEnumerable<RoomDto> rooms);
	Task<bool> UpdateRoomAsync(int id, RoomDto room);
	Task<bool> DeleteRoomAsync(int id);
	Task<bool> RequestCleaningAsync(int id);
	Task ChangeCleaningRequestedAsync(int id, bool requested);
	Task ChangeRoomStatusAsync(int id, string newStatus);
	Task ChangeRoomCleaningStatusAsync(int id, string newCleaningStatus);
}