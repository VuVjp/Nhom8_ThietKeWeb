using HotelManagement.Entities;

public interface IRoomImageRepository : IRepository<RoomImage>
{
    Task<IEnumerable<RoomImage>> GetImagesByRoomTypeIdAsync(int roomTypeId);
}