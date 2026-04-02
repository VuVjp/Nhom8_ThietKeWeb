using HotelManagement.Entities;

public interface IAmenityRepository : IRepository<Amenity>
{
    Task<IEnumerable<Amenity>> GetAllActiveAsync();
    Task<Amenity?> GetByNameNormalizedAsync(string name);
}