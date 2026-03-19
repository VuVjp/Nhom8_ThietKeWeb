using HotelManagement.Entities;

public interface IAmenityRepository : IRepository<Amenity>
{
    Task<IEnumerable<Amenity>> GetAllActiveAsync();
}