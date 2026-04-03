using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using HotelManagement.Dtos;
using HotelManagement.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Services.Implementations;

public class RoomService : IRoomService
{
	private readonly IRoomRepository _repository;
	private readonly AppDbContext _context;
	private readonly INotificationService _notificationService;

	public RoomService(IRoomRepository repository, AppDbContext context, INotificationService notificationService)
	{
		_repository = repository;
		_context = context;
		_notificationService = notificationService;
	}

	public async Task<IEnumerable<RoomDto>> GetListAsync()
	{
		var rooms = await _repository.GetAllAsync();
		return rooms.Select(MapToDto);
	}

	public async Task<IEnumerable<RoomDto>> GetByStatusAsync(string status)
	{
		var rooms = await _repository.GetByStatusAsync(status);
		return rooms.Select(MapToDto);
	}

	public async Task<RoomDto?> GetDetailAsync(int id)
	{
		var room = await _repository.GetByIdAsync(id);
		if (room == null) return null;

		return new RoomDto
		{
			Id = room.Id,
			RoomNumber = room.RoomNumber,
			Floor = room.Floor,
			Status = room.Status,
			CleaningStatus = room.CleaningStatus,
			RoomTypeId = room.RoomTypeId,
			RoomTypeName = room.RoomType?.Name
		};
	}

	public async Task<bool> CreateRoomAsync(RoomDto room)
	{
		// LOGIC 1: Kiểm tra số phòng trống/trùng	
		if (string.IsNullOrWhiteSpace(room.RoomNumber))
			throw new ArgumentException("Số phòng không được để trống.");

		if (await _repository.IsRoomNumberExistsAsync(room.RoomNumber))
			throw new ArgumentException($"Số phòng {room.RoomNumber} đã tồn tại trong hệ thống.");

		// LOGIC 2: Kiểm tra số tầng
		if (room.Floor < 0)
			throw new ArgumentException("Số tầng không thể là số âm.");

		// LOGIC 3: Mặc định trạng thái
		if (string.IsNullOrEmpty(room.Status)) room.Status = "Available";

		await EnsureActiveRoomTypeAsync(room.RoomTypeId);

		var newRoom = new Room
		{
			RoomNumber = room.RoomNumber,
			Floor = room.Floor,
			Status = room.Status,
			CleaningStatus = room.CleaningStatus,
			RoomTypeId = room.RoomTypeId
		};

		await _repository.AddAsync(newRoom);
		return await _repository.SaveChangesAsync();
	}

	public async Task<bool> UpdateRoomAsync(int id, RoomDto room)
	{
		var existing = await _repository.GetByIdAsync(id);
		if (existing == null) return false;

		await EnsureActiveRoomTypeAsync(room.RoomTypeId);

		// Cho phép cập nhật nhưng vẫn phải check trùng nếu đổi số phòng
		if (existing.RoomNumber != room.RoomNumber && await _repository.IsRoomNumberExistsAsync(room.RoomNumber))
			throw new ArgumentException("Số phòng mới đã tồn tại.");

		existing.RoomNumber = room.RoomNumber;
		existing.Floor = room.Floor;
		existing.Status = room.Status;
		existing.CleaningStatus = room.CleaningStatus;
		existing.RoomTypeId = room.RoomTypeId;

		_repository.Update(existing);
		return await _repository.SaveChangesAsync();
	}

	public async Task ChangeRoomStatusAsync(int id, string newStatus)
	{
		var room = await _repository.GetByIdAsync(id);
		if (room == null) throw new NotFoundException("Room not found.");
		if (newStatus.Equals(room.Status, StringComparison.OrdinalIgnoreCase)) throw new ArgumentException("New status must be different from current status.");
		var targetStatus = newStatus.Trim();
		if (string.Equals(targetStatus.ToLower(), "available", StringComparison.OrdinalIgnoreCase))
		{
			var validationMessage = await ValidateCleaningCompletionAsync(room.Id);
			validationMessage ??= await ValidateEquipmentAvailabilityForRoomAsync(room.Id);
			if (validationMessage != null)
			{
				room.Status = "Maintenance";
				room.CleaningStatus = "Inspecting";
				_repository.Update(room);
				await _repository.SaveChangesAsync();

				await _notificationService.SendByRoleAsync(RoleName.Admin, new CreateNotificationDto
				{
					Title = $"Room {room.RoomNumber} moved to Maintenance",
					Content = $"Room {room.RoomNumber} could not be returned to Available: {validationMessage}",
					Type = NotificationAction.CheckOut,
					ReferenceLink = $"admin/rooms/{room.Id}"
				});

				throw new InvalidOperationException($"Room cannot be set to Available: {validationMessage}");
			}
		}
		if (string.Equals(targetStatus.ToLower(), "maintenance", StringComparison.OrdinalIgnoreCase))
		{
			room.CleaningStatus = "Inspecting";
		}
		if (string.Equals(targetStatus.ToLower(), "available", StringComparison.OrdinalIgnoreCase) && !string.Equals(room.CleaningStatus, "Completed", StringComparison.OrdinalIgnoreCase))
		{
			room.CleaningStatus = "Clean";
		}
		if (string.Equals(targetStatus.ToLower(), "cleaning", StringComparison.OrdinalIgnoreCase))
		{
			room.CleaningStatus = "Dirty";
		}
		room.Status = targetStatus;
		_repository.Update(room);
		await _repository.SaveChangesAsync();
	}

	public async Task ChangeRoomCleaningStatusAsync(int id, string newCleaningStatus)
	{
		var room = await _repository.GetByIdAsync(id);
		if (room == null) throw new NotFoundException("Room not found.");
		if (newCleaningStatus.Equals(room.CleaningStatus, StringComparison.OrdinalIgnoreCase)) throw new ArgumentException("New cleaning status must be different from current cleaning status.");
		room.CleaningStatus = newCleaningStatus;
		_repository.Update(room);
		await _repository.SaveChangesAsync();
	}

	public async Task<bool> DeleteRoomAsync(int id)
	{
		var room = await _repository.GetByIdAsync(id);
		if (room == null) return false;

		_repository.Delete(room);
		return await _repository.SaveChangesAsync();
	}

	private static RoomDto MapToDto(Room room)
	{
		return new RoomDto
		{
			Id = room.Id,
			RoomNumber = room.RoomNumber,
			Floor = room.Floor,
			Status = room.Status,
			CleaningStatus = room.CleaningStatus,
			RoomTypeId = room.RoomTypeId,
			RoomTypeName = room.RoomType?.Name
		};
	}

	private async Task EnsureActiveRoomTypeAsync(int? roomTypeId)
	{
		if (!roomTypeId.HasValue)
			throw new ArgumentException("Room type is required.");

		var roomType = await _context.RoomTypes
			.AsNoTracking()
			.FirstOrDefaultAsync(item => item.Id == roomTypeId.Value);

		if (roomType == null)
			throw new NotFoundException($"Room type with ID {roomTypeId.Value} not found.");

		if (!roomType.IsActive)
			throw new ArgumentException("Selected room type is inactive.");
	}

	private async Task<string?> ValidateCleaningCompletionAsync(int roomId)
	{
		var inventories = await _context.RoomInventories
			.Where(item => item.RoomId == roomId && item.IsActive)
			.Select(item => new
			{
				item.Id,
				item.ItemName,
				Quantity = item.Quantity ?? 0
			})
			.ToListAsync();

		if (inventories.Count == 0)
		{
			return "room has no active inventory items";
		}

		var inventoryIds = inventories.Select(item => item.Id).ToList();
		var lossTotals = await _context.LossAndDamages
			.Where(loss => loss.RoomInventoryId.HasValue && inventoryIds.Contains(loss.RoomInventoryId.Value))
			.GroupBy(loss => loss.RoomInventoryId!.Value)
			.Select(group => new
			{
				RoomInventoryId = group.Key,
				TotalQuantity = group.Sum(loss => loss.Quantity)
			})
			.ToListAsync();

		foreach (var inventory in inventories)
		{
			if (inventory.Quantity <= 0)
			{
				return $"item '{inventory.ItemName}' has invalid quantity {inventory.Quantity}";
			}

			var lostQuantity = lossTotals.FirstOrDefault(item => item.RoomInventoryId == inventory.Id)?.TotalQuantity ?? 0;
			if (lostQuantity > 0)
			{
				var remainingQuantity = Math.Max(inventory.Quantity - lostQuantity, 0);
				return $"item '{inventory.ItemName}' is missing/damaged ({lostQuantity}), remaining {remainingQuantity}/{inventory.Quantity}";
			}
		}

		return null;
	}

	private async Task<string?> ValidateEquipmentAvailabilityForRoomAsync(int roomId)
	{
		var roomEquipments = await _context.RoomInventories
			.AsNoTracking()
			.Where(item => item.RoomId == roomId && item.IsActive && item.EquipmentId.HasValue)
			.Select(item => new
			{
				item.ItemName,
				EquipmentId = item.EquipmentId!.Value,
				Quantity = item.Quantity ?? 0
			})
			.ToListAsync();

		if (roomEquipments.Count == 0)
		{
			return null;
		}

		var equipmentIds = roomEquipments
			.Select(item => item.EquipmentId)
			.Distinct()
			.ToList();

		var equipmentMap = await _context.Equipments
			.AsNoTracking()
			.Where(item => equipmentIds.Contains(item.Id))
			.ToDictionaryAsync(item => item.Id);

		foreach (var grouped in roomEquipments.GroupBy(item => item.EquipmentId))
		{
			if (!equipmentMap.TryGetValue(grouped.Key, out var equipment))
			{
				return $"equipment with ID {grouped.Key} was not found";
			}

			if (!equipment.IsActive)
			{
				return $"equipment '{equipment.Name}' is inactive";
			}

			var roomAllocatedQuantity = grouped.Sum(item => item.Quantity);
			if (roomAllocatedQuantity <= 0)
			{
				return $"equipment '{equipment.Name}' has invalid quantity {roomAllocatedQuantity}";
			}

			var inUseExcludingCurrentRoom = Math.Max(equipment.InUseQuantity - roomAllocatedQuantity, 0);
			var availableForCurrentRoom = equipment.TotalQuantity - inUseExcludingCurrentRoom - equipment.DamagedQuantity - equipment.LiquidatedQuantity;

			if (availableForCurrentRoom < roomAllocatedQuantity)
			{
				return $"equipment '{equipment.Name}' exceeds available stock ({roomAllocatedQuantity}/{Math.Max(availableForCurrentRoom, 0)})";
			}
		}

		return null;
	}
}