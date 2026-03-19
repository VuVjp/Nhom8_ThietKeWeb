using HotelManagement.Entities;

public class AmenityService : IAmenityService
{
    private readonly IAmenityRepository _repo;

    public AmenityService(IAmenityRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<AmenityDto>> GetAllAsync()
    {
        var data = await _repo.GetAllActiveAsync();

        return data.Select(a => new AmenityDto
        {
            Id = a.Id,
            Name = a.Name,
            IconUrl = a.IconUrl
        });
    }

    public async Task<AmenityDto?> GetByIdAsync(int id)
    {
        var a = await _repo.GetByIdAsync(id);
        if (a == null || !a.IsActive) return null;

        return new AmenityDto
        {
            Id = a.Id,
            Name = a.Name,
            IconUrl = a.IconUrl
        };
    }

    public async Task<AmenityDto> CreateAsync(CreateAmenityDto dto)
    {
        var entity = new Amenity
        {
            Name = dto.Name,
            IconUrl = dto.IconUrl
        };

        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();

        return new AmenityDto
        {
            Id = entity.Id,
            Name = entity.Name,
            IconUrl = entity.IconUrl
        };
    }

    public async Task<bool> UpdateAsync(int id, UpdateAmenityDto dto)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive) return false;

        entity.Name = dto.Name;
        entity.IconUrl = dto.IconUrl;

        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive) return false;

        entity.IsActive = false;
        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }
}