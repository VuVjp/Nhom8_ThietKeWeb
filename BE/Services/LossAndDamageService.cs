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
    private readonly IInvoiceService _invoiceService;

    public LossAndDamageService(
        ILossAndDamageRepository repository, 
        AppDbContext context, 
        INotificationService notificationService,
        IInvoiceService invoiceService)
    {
        _repository = repository;
        _context = context;
        _notificationService = notificationService;
        _invoiceService = invoiceService;
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

        // Find the active/recent booking detail for this room to associate the penalty
        if (inventory.RoomId.HasValue)
        {
            var bookingDetail = await _context.BookingDetails
                .Include(bd => bd.Booking)
                .Where(bd => bd.RoomId == inventory.RoomId.Value)
                .Where(bd => bd.Booking!.Status == "CheckedIn" || bd.Booking!.Status == "CheckedOut")
                .OrderByDescending(bd => bd.Booking!.Id)
                .FirstOrDefaultAsync();

            if (bookingDetail != null)
            {
                entity.BookingDetailId = bookingDetail.Id;
            }
        }

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

            // Update the invoice for this booking
            if (entity.BookingDetailId.HasValue)
            {
                var detail = await _context.BookingDetails.FindAsync(entity.BookingDetailId.Value);
                if (detail?.BookingId != null)
                {
                    await _invoiceService.UpdateInvoiceAmountsAsync(detail.BookingId.Value);
                }
            }
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