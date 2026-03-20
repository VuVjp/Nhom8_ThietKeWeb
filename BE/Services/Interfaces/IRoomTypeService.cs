using HotelManagement.Dtos;

public interface IRoomTypeService
{
    Task<IEnumerable<RoomTypeDto>> GetAllRoomTypesAsync();
    Task<RoomTypeDto?> GetRoomTypeByIdAsync(int id);
    Task<bool> CreateRoomTypeAsync(CreateRoomTypeDto dto);
    Task<bool> UpdateRoomTypeAsync(int id, UpdateRoomTypeDto dto);
    Task<bool> DeleteRoomTypeAsync(int id);
    Task<bool> AddImageAsync(int id, AddRoomImageDto dto);
    Task<bool> DeleteImageAsync(int id);
    Task<bool> SetPrimaryImageAsync(int roomTypeId, int imageId);
}
    