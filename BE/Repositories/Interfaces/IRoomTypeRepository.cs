using HotelManagement.Entities;

public interface IRoomTypeRepository : IRepository<RoomType>
{
    Task<IEnumerable<RoomType>> GetAllActiveWithImagesAsync();
}