using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;

namespace HotelManagement.Services.Implementations;

public class VoucherService : IVoucherService
{
    private readonly IVoucherRepository _repo;

    public VoucherService(IVoucherRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<VoucherDto>> GetAllAsync()
    {
        var data = await _repo.GetAllAsync();
        return data.OrderByDescending(item => item.Id).Select(ToDto);
    }

    public async Task<VoucherDto?> GetByIdAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null)
        {
            return null;
        }

        return ToDto(entity);
    }

    public async Task<bool> CreateAsync(CreateVoucherDto dto)
    {
        ValidateCreate(dto);

        var normalizedCode = dto.Code.Trim().ToUpperInvariant();
        var existed = await _repo.GetByCodeAsync(normalizedCode);
        if (existed != null)
        {
            throw new ConflictException("Voucher code already exists.");
        }

        var entity = new Voucher
        {
            Code = normalizedCode,
            DiscountType = dto.DiscountType.Trim(),
            DiscountValue = dto.DiscountValue,
            MinBookingValue = dto.MinBookingValue,
            ValidFrom = dto.ValidFrom,
            ValidTo = dto.ValidTo,
            UsageLimit = dto.UsageLimit,
            UsageCount = 0,
            IsActive = true,
        };

        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateAsync(int id, UpdateVoucherDto dto)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null)
        {
            return false;
        }

        ValidateUpdate(dto, entity);

        if (!string.IsNullOrWhiteSpace(dto.Code))
        {
            var normalizedCode = dto.Code.Trim().ToUpperInvariant();
            if (!string.Equals(entity.Code, normalizedCode, StringComparison.OrdinalIgnoreCase))
            {
                var existed = await _repo.GetByCodeAsync(normalizedCode);
                if (existed != null && existed.Id != entity.Id)
                {
                    throw new ConflictException("Voucher code already exists.");
                }
            }

            entity.Code = normalizedCode;
        }

        if (!string.IsNullOrWhiteSpace(dto.DiscountType))
        {
            entity.DiscountType = dto.DiscountType.Trim();
        }

        if (dto.DiscountValue.HasValue)
        {
            entity.DiscountValue = dto.DiscountValue.Value;
        }

        if (dto.MinBookingValue.HasValue)
        {
            entity.MinBookingValue = dto.MinBookingValue.Value;
        }

        if (dto.ValidFrom.HasValue)
        {
            entity.ValidFrom = dto.ValidFrom;
        }

        if (dto.ValidTo.HasValue)
        {
            entity.ValidTo = dto.ValidTo;
        }

        if (dto.UsageLimit.HasValue)
        {
            entity.UsageLimit = dto.UsageLimit;
        }

        _repo.Update(entity);
        await _repo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleActiveAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null)
        {
            return false;
        }

        entity.IsActive = !entity.IsActive;
        _repo.Update(entity);
        await _repo.SaveChangesAsync();
        return true;
    }

    private static VoucherDto ToDto(Voucher entity)
    {
        return new VoucherDto
        {
            Id = entity.Id,
            Code = entity.Code,
            DiscountType = entity.DiscountType,
            DiscountValue = entity.DiscountValue,
            MinBookingValue = entity.MinBookingValue,
            ValidFrom = entity.ValidFrom,
            ValidTo = entity.ValidTo,
            UsageLimit = entity.UsageLimit,
            UsageCount = entity.UsageCount,
            IsActive = entity.IsActive,
        };
    }

    private static void ValidateCreate(CreateVoucherDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
        {
            throw new ArgumentException("Code is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.DiscountType))
        {
            throw new ArgumentException("DiscountType is required.");
        }

        if (dto.DiscountValue <= 0)
        {
            throw new ArgumentException("DiscountValue must be greater than 0.");
        }

        if (dto.MinBookingValue.HasValue && dto.MinBookingValue.Value < 0)
        {
            throw new ArgumentException("MinBookingValue cannot be negative.");
        }

        if (dto.UsageLimit.HasValue && dto.UsageLimit.Value < 0)
        {
            throw new ArgumentException("UsageLimit cannot be negative.");
        }

        if (dto.ValidFrom.HasValue && dto.ValidTo.HasValue && dto.ValidTo < dto.ValidFrom)
        {
            throw new ArgumentException("ValidTo must be greater than or equal to ValidFrom.");
        }
    }

    public async Task ValidateCodeAsync(string code)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var voucher = await _repo.GetByCodeAsync(normalized);
        if (voucher == null)
        {
            throw new ArgumentException("Invalid voucher code.");
        }
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ArgumentException("Code is required.");
        }
        if (!voucher.IsActive)
        {
            throw new ArgumentException("Voucher is not active.");
        }
        if (voucher.ValidFrom.HasValue && voucher.ValidFrom > DateTime.UtcNow)
        {
            throw new ArgumentException("Voucher is not valid yet.");
        }
        if (voucher.ValidTo.HasValue && voucher.ValidTo < DateTime.UtcNow)
        {
            throw new ArgumentException("Voucher has expired.");
        }
        if (voucher.UsageLimit.HasValue && voucher.UsageCount >= voucher.UsageLimit.Value)
        {
            throw new ArgumentException("Voucher usage limit has been reached.");
        }
        if (voucher.MinBookingValue.HasValue)
        {
            throw new ArgumentException($"Voucher requires minimum booking value of {voucher.MinBookingValue.Value}.");
        }
        if (voucher.UsageLimit <= voucher.UsageCount)
        {
            throw new ArgumentException("Voucher usage limit has been reached.");
        }
    }

    private static void ValidateUpdate(UpdateVoucherDto dto, Voucher current)
    {
        var discountValue = dto.DiscountValue ?? current.DiscountValue;
        var minBooking = dto.MinBookingValue ?? current.MinBookingValue;
        var usageLimit = dto.UsageLimit ?? current.UsageLimit;
        var validFrom = dto.ValidFrom ?? current.ValidFrom;
        var validTo = dto.ValidTo ?? current.ValidTo;

        if (discountValue <= 0)
        {
            throw new ArgumentException("DiscountValue must be greater than 0.");
        }

        if (minBooking.HasValue && minBooking.Value < 0)
        {
            throw new ArgumentException("MinBookingValue cannot be negative.");
        }

        if (usageLimit.HasValue && usageLimit.Value < 0)
        {
            throw new ArgumentException("UsageLimit cannot be negative.");
        }

        if (validFrom.HasValue && validTo.HasValue && validTo < validFrom)
        {
            throw new ArgumentException("ValidTo must be greater than or equal to ValidFrom.");
        }
    }
}