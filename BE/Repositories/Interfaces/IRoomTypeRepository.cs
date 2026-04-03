using HotelManagement.Entities;

public interface IRoomTypeRepository : IRepository<RoomType>
{
    Task<IEnumerable<RoomType>> GetAllActiveWithImagesAsync();
    Task<IEnumerable<RoomType>> GetAllActiveWithImagesAndAmenitiesAsync();
    Task<IEnumerable<RoomType>> GetAllWithImagesAndAmenitiesAsync();
    Task<RoomType?> GetByIdWithImagesAndAmenitiesAsync(int id);
    Task<bool> AddAmenityAsync(int roomTypeId, int amenityId);
    Task<bool> AddAmenitiesAsync(int roomTypeId, IEnumerable<int> amenityIds);
    Task<bool> RemoveAmenityAsync(int roomTypeId, int amenityId);
}