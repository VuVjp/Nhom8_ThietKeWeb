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
	private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
	{ "Available", "Occupied", "Maintenance", "InsClean"
	};
	private static readonly HashSet<string> ValidCondition = new(StringComparer.OrdinalIgnoreCase)
	 {
		"Clean", "Dirty", "Inspecting","Cleaning"
	 };
	private readonly IRoomRepository _repository;
	private readonly AppDbContext _context;
	private readonly INotificationService _notificationService;
	private readonly IInvoiceService _invoiceService;

	public RoomService(IRoomRepository repository, AppDbContext context, INotificationService notificationService, IInvoiceService invoiceService)
	{
		_repository = repository;
		_context = context;
		_notificationService = notificationService;
		_invoiceService = invoiceService;
	}

	public async Task<IEnumerable<RoomDto>> GetListAsync()
	{
		var rooms = await _repository.GetAllAsync();
		return rooms.Select(MapToDto);
	}

	public async Task ChangeCleaningRequestedAsync(int id, bool requested)
	{
		var room = await _repository.GetByIdAsync(id);
		if (room == null) throw new NotFoundException("Room not found.");

		if (room.CleaningRequested == requested) return;
		else if (!requested && room.Status!.Equals("InsClean", StringComparison.OrdinalIgnoreCase))
		{
			room.Status = "Available";
		}
		room.CleaningRequested = requested;
		_repository.Update(room);
		await _repository.SaveChangesAsync();
	}

	public async Task<IEnumerable<RoomDto>> GetByStatusAsync(string status, bool includeCleaningRequested = false)
	{
		var rooms = await _repository.GetByStatusAsync(status, includeCleaningRequested: includeCleaningRequested);

		return rooms.Select(MapToDto);
	}

	public async Task<IEnumerable<RoomDto>> GetByCleaningStatusAsync(string cleaningStatus)
	{
		var rooms = await _repository.GetByCleaningStatusAsync(cleaningStatus);
		return rooms.Select(MapToDto);
	}

	public async Task<bool> RequestCleaningAsync(int id)
	{
		var room = await _repository.GetByIdAsync(id);
		if (room == null) return false;

		room.CleaningRequested = true;
		_repository.Update(room);
		return await _repository.SaveChangesAsync();
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
		await ValidateCreateRoomInputAsync(room, new HashSet<string>(StringComparer.OrdinalIgnoreCase));

		var newRoom = new Room
		{
			RoomNumber = room.RoomNumber.Trim(),
			Floor = room.Floor,
			Status = room.Status,
			CleaningStatus = room.CleaningStatus,
			RoomTypeId = room.RoomTypeId
		};

		await _repository.AddAsync(newRoom);
		return await _repository.SaveChangesAsync();
	}

	public async Task<int> CreateRoomsBulkAsync(IEnumerable<RoomDto> rooms)
	{
		if (rooms == null)
			throw new ArgumentException("Room list is required.");

		var roomList = rooms.ToList();
		if (roomList.Count == 0)
			throw new ArgumentException("Room list is required.");


		var batchRoomNumbers = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

		foreach (var room in roomList)
		{
			await ValidateCreateRoomInputAsync(room, batchRoomNumbers);

			var newRoom = new Room
			{
				RoomNumber = room.RoomNumber.Trim(),
				Floor = room.Floor,
				Status = room.Status,
				CleaningStatus = room.CleaningStatus,
				RoomTypeId = room.RoomTypeId
			};

			await _repository.AddAsync(newRoom);
		}

		var saved = await _repository.SaveChangesAsync();
		return saved ? roomList.Count : 0;
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
		if (newStatus.Equals(room.Status, StringComparison.OrdinalIgnoreCase)) return;
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
		if (string.Equals(targetStatus.ToLower(), "available", StringComparison.OrdinalIgnoreCase) && !string.Equals(room.CleaningStatus, "Completed", StringComparison.OrdinalIgnoreCase))
		{
			await EnsureActiveRoomTypeAsync(room.RoomTypeId);
			room.CleaningStatus = "Clean";
		}
		if (string.Equals(targetStatus.ToLower(), "InsClean", StringComparison.OrdinalIgnoreCase))
		{
			room.CleaningStatus = "Inspecting";
		}
		room.Status = targetStatus;
		_repository.Update(room);
		await _repository.SaveChangesAsync();
	}

	public async Task ChangeRoomCleaningStatusAsync(int id, string newCleaningStatus)
	{
		var room = await _repository.GetByIdAsync(id);
		if (room == null) throw new NotFoundException("Room not found.");
		if (newCleaningStatus.Equals(room.CleaningStatus, StringComparison.OrdinalIgnoreCase)) return;
		room.CleaningStatus = newCleaningStatus;
		_repository.Update(room);
		await _repository.SaveChangesAsync();

		if (newCleaningStatus.Equals("Cleaning", StringComparison.OrdinalIgnoreCase) || 
			newCleaningStatus.Equals("Clean", StringComparison.OrdinalIgnoreCase))
		{
			// Find the most recent CheckedOut booking for this room
			var booking = await _context.Bookings
				.Include(b => b.BookingDetails)
					.ThenInclude(bd => bd.Room)
				.Where(b => b.Status == "CheckedOut")
				.Where(b => b.BookingDetails.Any(bd => bd.RoomId == id))
				.OrderByDescending(b => b.Id)
				.FirstOrDefaultAsync();

			if (booking != null)
			{
				// Check if ALL rooms in this booking are either Cleaning or Clean
				bool allRoomsReady = booking.BookingDetails.All(bd => 
					bd.Room != null && 
					(bd.Room.CleaningStatus.Equals("Cleaning", StringComparison.OrdinalIgnoreCase) || 
					 bd.Room.CleaningStatus.Equals("Clean", StringComparison.OrdinalIgnoreCase)));

				if (allRoomsReady)
				{
					// Trigger the invoice creation (and charge sync) only when all rooms are ready
					await _invoiceService.CreateInvoiceAsync(booking.Id);
				}
			}
		}
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
			RoomTypeName = room.RoomType?.Name,
			CleaningRequested = room.CleaningRequested
		};
	}

	private async Task ValidateCreateRoomInputAsync(RoomDto room, HashSet<string> batchRoomNumbers)
	{
		if (room == null)
			throw new ArgumentException("Room data is required.");

		if (string.IsNullOrWhiteSpace(room.RoomNumber))
			throw new ArgumentException("Room number is required.");

		var normalizedRoomNumber = room.RoomNumber.Trim();
		if (!batchRoomNumbers.Add(normalizedRoomNumber))
			throw new ArgumentException($"Room number {normalizedRoomNumber} is duplicated in the batch.");

		if (await _repository.IsRoomNumberExistsAsync(normalizedRoomNumber))
			throw new ArgumentException($"Room number {normalizedRoomNumber} already exists in the system.");

		if (room.Floor < 0)
			throw new ArgumentException("Floor number cannot be a negative value.");

		if (string.IsNullOrWhiteSpace(room.Status))
			room.Status = "Available";

		await EnsureActiveRoomTypeAsync(room.RoomTypeId);
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