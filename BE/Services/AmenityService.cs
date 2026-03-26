using HotelManagement.Entities;

public class AmenityService : IAmenityService
{
    private readonly IAmenityRepository _repo;
    private readonly ICloudinaryService _cloudinary;

    public AmenityService(IAmenityRepository repo, ICloudinaryService cloudinary)
    {
        _repo = repo;
        _cloudinary = cloudinary;
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
        if (a == null || !a.IsActive) throw new NotFoundException($"Amenity with ID {id} not found.");

        return new AmenityDto
        {
            Id = a.Id,
            Name = a.Name,
            IconUrl = a.IconUrl
        };
    }

    public async Task<bool> CreateAsync(CreateAmenityRequestDto dto)
    {
        string? iconUrl = null;

        if (dto.File != null)
        {
            iconUrl = await _cloudinary.UploadImageAsync(dto.File, "amenities", dto.Name);
        }

        var entity = new Amenity
        {
            Name = dto.Name,
            IconUrl = iconUrl
        };

        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdateAsync(int id, UpdateAmenityDto dto)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive) throw new NotFoundException($"Amenity with ID {id} not found.");

        entity.Name = dto.Name;
        if (dto.File != null)
        {
            entity.IconUrl = await _cloudinary.UploadImageAsync(dto.File, "amenities", dto.Name);
        }
        else
        {
            entity.IconUrl = dto.IconUrl;
        }

        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive) throw new NotFoundException($"Amenity with ID {id} not found.");

        entity.IsActive = false;
        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }
}