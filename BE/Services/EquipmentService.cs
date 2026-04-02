using HotelManagement.Entities;
using HotelManagement.Dtos;

public class EquipmentService : IEquipmentService
{
    private readonly IEquipmentRepository _repo;
    private readonly ICloudinaryService _cloudinary;

    public EquipmentService(IEquipmentRepository repo, ICloudinaryService cloudinary)
    {
        _repo = repo;
        _cloudinary = cloudinary;
    }

    public async Task<IEnumerable<EquipmentDto>> GetAllAsync()
    {
        var data = await _repo.GetAllActiveAsync();
        return data.Select(ToDto);
    }

    public async Task<EquipmentDto?> GetByIdAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive)
        {
            throw new NotFoundException($"Equipment with ID {id} not found.");
        }

        return ToDto(entity);
    }

    public async Task<bool> CreateAsync(CreateEquipmentDto dto)
    {
        ValidateCreateDto(dto);

        var normalizedCode = dto.ItemCode!.Trim().ToUpperInvariant();
        var existing = await _repo.GetByItemCodeAsync(normalizedCode);
        if (existing != null && existing.IsActive)
        {
            throw new ConflictException($"Equipment code '{normalizedCode}' already exists.");
        }

        string imageUrl = string.Empty;
        if (dto.File != null)
        {
            imageUrl = await _cloudinary.UploadImageAsync(dto.File, "equipments", normalizedCode);
        }

        var entity = new Equipment
        {
            ItemCode = normalizedCode,
            Name = dto.Name!.Trim(),
            Category = dto.Category!.Trim(),
            Unit = dto.Unit!.Trim(),
            TotalQuantity = dto.TotalQuantity,
            InUseQuantity = 0,
            DamagedQuantity = 0,
            LiquidatedQuantity = 0,
            BasePrice = dto.BasePrice,
            DefaultPriceIfLost = dto.DefaultPriceIfLost,
            Supplier = dto.Supplier?.Trim() ?? string.Empty,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ImageUrl = imageUrl,
        };

        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateAsync(int id, UpdateEquipmentDto dto)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive)
        {
            throw new NotFoundException($"Equipment with ID {id} not found.");
        }

        ValidateUpdateDto(dto);

        entity.Name = dto.Name!.Trim();
        entity.Category = dto.Category!.Trim();
        entity.Unit = dto.Unit!.Trim();
        entity.TotalQuantity = dto.TotalQuantity;
        entity.InUseQuantity = dto.InUseQuantity;
        entity.DamagedQuantity = dto.DamagedQuantity;
        entity.LiquidatedQuantity = dto.LiquidatedQuantity;
        entity.BasePrice = dto.BasePrice;
        entity.DefaultPriceIfLost = dto.DefaultPriceIfLost;
        entity.Supplier = dto.Supplier?.Trim() ?? string.Empty;
        entity.IsActive = dto.IsActive;

        if (dto.File != null)
        {
            entity.ImageUrl = await _cloudinary.UploadImageAsync(dto.File, "equipments", entity.ItemCode);
        }
        else if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            entity.ImageUrl = dto.ImageUrl.Trim();
        }

        entity.UpdatedAt = DateTime.UtcNow;

        _repo.Update(entity);
        await _repo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive)
        {
            throw new NotFoundException($"Equipment with ID {id} not found.");
        }

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;

        _repo.Update(entity);
        await _repo.SaveChangesAsync();
        return true;
    }

    private static EquipmentDto ToDto(Equipment entity)
    {
        return new EquipmentDto
        {
            Id = entity.Id,
            ItemCode = entity.ItemCode,
            Name = entity.Name,
            Category = entity.Category,
            Unit = entity.Unit,
            TotalQuantity = entity.TotalQuantity,
            InUseQuantity = entity.InUseQuantity,
            DamagedQuantity = entity.DamagedQuantity,
            LiquidatedQuantity = entity.LiquidatedQuantity,
            BasePrice = entity.BasePrice,
            DefaultPriceIfLost = entity.DefaultPriceIfLost,
            Supplier = entity.Supplier,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            ImageUrl = entity.ImageUrl,
        };
    }

    private static void ValidateCreateDto(CreateEquipmentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ItemCode))
        {
            throw new ArgumentException("ItemCode is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException("Name is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Category))
        {
            throw new ArgumentException("Category is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Unit))
        {
            throw new ArgumentException("Unit is required.");
        }

        if (dto.TotalQuantity < 0)
        {
            throw new ArgumentException("TotalQuantity cannot be negative.");
        }

        if (dto.BasePrice < 0 || dto.DefaultPriceIfLost < 0)
        {
            throw new ArgumentException("Price values cannot be negative.");
        }
    }

    private static void ValidateUpdateDto(UpdateEquipmentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException("Name is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Category))
        {
            throw new ArgumentException("Category is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Unit))
        {
            throw new ArgumentException("Unit is required.");
        }

        if (dto.TotalQuantity < 0 || dto.InUseQuantity < 0 || dto.DamagedQuantity < 0 || dto.LiquidatedQuantity < 0)
        {
            throw new ArgumentException("Quantity values cannot be negative.");
        }

        if (dto.InUseQuantity + dto.DamagedQuantity + dto.LiquidatedQuantity > dto.TotalQuantity)
        {
            throw new ArgumentException("Usage quantities cannot exceed total quantity.");
        }

        if (dto.BasePrice < 0 || dto.DefaultPriceIfLost < 0)
        {
            throw new ArgumentException("Price values cannot be negative.");
        }
    }
}
