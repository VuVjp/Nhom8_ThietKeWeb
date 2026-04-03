using HotelManagement.Entities;
using System.Text.RegularExpressions;

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
        var data = await _repo.GetAllAsync();

        return data.Select(a => new AmenityDto
        {
            Id = a.Id,
            Name = a.Name,
            IconUrl = a.IconUrl,
            IsActive = a.IsActive
        });
    }

    public async Task<AmenityDto?> GetByIdAsync(int id)
    {
        var a = await _repo.GetByIdAsync(id);
        if (a == null) throw new NotFoundException($"Amenity with ID {id} not found.");

        return new AmenityDto
        {
            Id = a.Id,
            Name = a.Name,
            IconUrl = a.IconUrl,
            IsActive = a.IsActive
        };
    }

    public async Task<bool> CreateAsync(CreateAmenityRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException("Amenity name is required.");
        }

        var normalizedName = dto.Name.Trim();
        var normalizedKey = NormalizeKey(normalizedName);
        var existing = (await _repo.GetAllAsync())
            .FirstOrDefault(a => NormalizeKey(a.Name) == normalizedKey);

        string? iconUrl = null;

        if (dto.File != null)
        {
            iconUrl = await _cloudinary.UploadImageAsync(dto.File, "amenities", normalizedName);
        }

        if (existing != null)
        {
            if (existing.IsActive)
            {
                throw new ConflictException($"Amenity '{normalizedName}' already exists.");
            }

            existing.Name = normalizedName;
            existing.IsActive = true;

            if (!string.IsNullOrWhiteSpace(iconUrl))
            {
                existing.IconUrl = iconUrl;
            }

            _repo.Update(existing);
            await _repo.SaveChangesAsync();
            return true;
        }

        var entity = new Amenity
        {
            Name = normalizedName,
            IconUrl = iconUrl
        };

        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    private static string NormalizeKey(string value)
    {
        var trimmed = value.Trim().ToLowerInvariant();
        return Regex.Replace(trimmed, "\\s+", " ");
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

    public async Task<bool> ToggleActiveAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) throw new NotFoundException($"Amenity with ID {id} not found.");

        entity.IsActive = !entity.IsActive;
        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }
}