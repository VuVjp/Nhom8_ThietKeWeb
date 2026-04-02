using HotelManagement.Data;
using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Services.Implementations;

public class LossAndDamageService : ILossAndDamageService
{
    private readonly ILossAndDamageRepository _repository;
    private readonly AppDbContext _context;

    public LossAndDamageService(ILossAndDamageRepository repository, AppDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<IEnumerable<LossAndDamageDto>> GetAllAsync()
    {
        var records = await _repository.GetAllAsync();
        return records.Select(MapToDto);
    }

    public async Task<IEnumerable<LossAndDamageDto>> GetByRoomAsync(int roomId)
    {
        var records = await _repository.GetByRoomIdAsync(roomId);
        return records.Select(MapToDto);
    }

    public async Task<bool> CreateAsync(CreateLossAndDamageDto dto)
    {
        if (!dto.RoomInventoryId.HasValue)
            throw new ArgumentException("RoomInventoryId is required.");

        if (dto.Quantity <= 0)
            throw new ArgumentException("Quantity must be greater than zero.");

        if (dto.PenaltyAmount < 0)
            throw new ArgumentException("PenaltyAmount cannot be negative.");

        var inventory = await _context.RoomInventories
            .Include(x => x.Room)
            .FirstOrDefaultAsync(x => x.Id == dto.RoomInventoryId.Value && x.IsActive);

        if (inventory == null)
            throw new NotFoundException("Room inventory item not found.");

        var entity = new LossAndDamage
        {
            RoomInventoryId = inventory.Id,
            Quantity = dto.Quantity,
            PenaltyAmount = dto.PenaltyAmount,
            Description = dto.Description?.Trim(),
            ImageUrl = dto.ImageUrl?.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        await _repository.AddAsync(entity);
        await _repository.SaveChangesAsync();
        return true;
    }

    private static LossAndDamageDto MapToDto(LossAndDamage entity)
    {
        return new LossAndDamageDto
        {
            Id = entity.Id,
            RoomInventoryId = entity.RoomInventoryId,
            RoomId = entity.RoomInventory?.RoomId,
            RoomNumber = entity.RoomInventory?.Room?.RoomNumber,
            ItemName = entity.RoomInventory?.ItemName,
            Quantity = entity.Quantity,
            PenaltyAmount = entity.PenaltyAmount,
            Description = entity.Description,
            ImageUrl = entity.ImageUrl,
            CreatedAt = entity.CreatedAt,
        };
    }
}