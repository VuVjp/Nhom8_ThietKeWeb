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
    private readonly INotificationService _notificationService;

    public LossAndDamageService(ILossAndDamageRepository repository, AppDbContext context, INotificationService notificationService)
    {
        _repository = repository;
        _context = context;
        _notificationService = notificationService;
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

        Equipment? equipment = null;
        if (inventory.EquipmentId.HasValue)
        {
            equipment = await _context.Equipments.FirstOrDefaultAsync(x => x.Id == inventory.EquipmentId.Value && x.IsActive);
            if (equipment != null)
            {
                equipment.DamagedQuantity += dto.Quantity;
                equipment.UpdatedAt = DateTime.UtcNow;
                _context.Equipments.Update(equipment);
            }
        }

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
        var created = await _repository.SaveChangesAsync();

        if (created)
        {
            var roomNumber = inventory.Room?.RoomNumber ?? "Unknown";
            var itemName = string.IsNullOrWhiteSpace(inventory.ItemName) ? "Unknown item" : inventory.ItemName.Trim();

            await _notificationService.SendByRoleAsync(RoleName.Admin, new CreateNotificationDto
            {
                Title = $"New loss/damage report - Room {roomNumber}",
                Content = $"Item: {itemName}. Reported quantity: {dto.Quantity}. Penalty: {dto.PenaltyAmount}.",
                Type = NotificationAction.CheckOut,
                ReferenceLink = "admin/cleaning"
            });
        }

        return created;
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