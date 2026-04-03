using HotelManagement.Entities;
using HotelManagement.Dtos;
using System.Text.RegularExpressions;

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
        var data = await _repo.GetAllAsync();
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
        var normalizedName = dto.Name!.Trim();

        var allEquipments = await _repo.GetAllAsync();
        var normalizedCodeKey = NormalizeCodeKey(normalizedCode);
        var normalizedNameKey = NormalizeNameKey(normalizedName);

        var existingByCode = allEquipments.FirstOrDefault(e => NormalizeCodeKey(e.ItemCode) == normalizedCodeKey);
        var existingByName = allEquipments.FirstOrDefault(e => NormalizeNameKey(e.Name) == normalizedNameKey);
        var existing = existingByCode ?? existingByName;

        if (existingByCode != null && existingByName != null && existingByCode.Id != existingByName.Id)
        {
            throw new ConflictException("Another equipment already exists with the same code or name.");
        }

        if (existing != null)
        {
            if (existing.IsActive)
            {
                existing.TotalQuantity = dto.TotalQuantity;
                existing.InUseQuantity = 0;
                existing.DamagedQuantity = 0;
                existing.LiquidatedQuantity = 0;
                existing.BasePrice = dto.BasePrice;
                existing.DefaultPriceIfLost = dto.DefaultPriceIfLost;
                existing.Supplier = dto.Supplier?.Trim() ?? string.Empty;
                existing.Category = dto.Category!.Trim();
                existing.Unit = dto.Unit!.Trim();
                existing.Name = normalizedName;
                existing.ItemCode = normalizedCode;

                if (dto.File != null)
                {
                    existing.ImageUrl = await _cloudinary.UploadImageAsync(dto.File, "equipments", normalizedCode);
                }

                existing.UpdatedAt = DateTime.UtcNow;
                _repo.Update(existing);
                await _repo.SaveChangesAsync();
                return true;
            }

            existing.ItemCode = normalizedCode;
            existing.Name = normalizedName;
            existing.Category = dto.Category!.Trim();
            existing.Unit = dto.Unit!.Trim();
            existing.TotalQuantity = dto.TotalQuantity;
            existing.InUseQuantity = 0;
            existing.DamagedQuantity = 0;
            existing.LiquidatedQuantity = 0;
            existing.BasePrice = dto.BasePrice;
            existing.DefaultPriceIfLost = dto.DefaultPriceIfLost;
            existing.Supplier = dto.Supplier?.Trim() ?? string.Empty;
            existing.IsActive = true;

            if (dto.File != null)
            {
                existing.ImageUrl = await _cloudinary.UploadImageAsync(dto.File, "equipments", normalizedCode);
            }

            existing.UpdatedAt = DateTime.UtcNow;
            _repo.Update(existing);
            await _repo.SaveChangesAsync();
            return true;
        }

        string imageUrl = string.Empty;
        if (dto.File != null)
        {
            imageUrl = await _cloudinary.UploadImageAsync(dto.File, "equipments", normalizedCode);
        }

        var entity = new Equipment
        {
            ItemCode = normalizedCode,
            Name = normalizedName,
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

        if (!string.IsNullOrWhiteSpace(dto.Name))
            entity.Name = dto.Name.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Category))
            entity.Category = dto.Category.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Unit))
            entity.Unit = dto.Unit.Trim();
        if (dto.TotalQuantity.HasValue)
            entity.TotalQuantity = dto.TotalQuantity.Value;
        if (dto.InUseQuantity.HasValue)
            entity.InUseQuantity = dto.InUseQuantity.Value;
        if (dto.DamagedQuantity.HasValue)
            entity.DamagedQuantity = dto.DamagedQuantity.Value;
        if (dto.LiquidatedQuantity.HasValue)
            entity.LiquidatedQuantity = dto.LiquidatedQuantity.Value;
        if (dto.BasePrice.HasValue)
            entity.BasePrice = dto.BasePrice.Value;
        if (dto.DefaultPriceIfLost.HasValue)
            entity.DefaultPriceIfLost = dto.DefaultPriceIfLost.Value;
        if (!string.IsNullOrWhiteSpace(dto.Supplier))
            entity.Supplier = dto.Supplier.Trim();
        if (dto.IsActive.HasValue)
            entity.IsActive = dto.IsActive.Value;

        entity.UpdatedAt = DateTime.UtcNow;

        _repo.Update(entity);
        await _repo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleActiveAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null)
        {
            throw new NotFoundException($"Equipment with ID {id} not found.");
        }

        entity.IsActive = !entity.IsActive;
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

    private static string NormalizeCodeKey(string? value)
    {
        return (value ?? string.Empty).Trim().ToUpperInvariant();
    }

    private static string NormalizeNameKey(string? value)
    {
        var trimmed = (value ?? string.Empty).Trim().ToLowerInvariant();
        return Regex.Replace(trimmed, "\\s+", " ");
    }
}
