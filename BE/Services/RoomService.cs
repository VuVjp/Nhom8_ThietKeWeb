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

		var targetStatus = newStatus.Trim();
		if (string.Equals(targetStatus, "Available", StringComparison.OrdinalIgnoreCase) && string.Equals(room.Status, "Cleaning", StringComparison.OrdinalIgnoreCase))
		{
			var validationMessage = await ValidateCleaningCompletionAsync(room.Id);
			if (validationMessage != null)
			{
				room.Status = "Maintenance";
				room.CleaningStatus = "Dirty";
				_repository.Update(room);
				await _repository.SaveChangesAsync();

				await _notificationService.SendByRoleAsync(RoleName.Admin, new CreateNotificationDto
				{
					Title = $"Room {room.RoomNumber} moved to Maintenance",
					Content = $"Room {room.RoomNumber} could not be returned to Available: {validationMessage}",
					Type = NotificationAction.CheckOut,
					ReferenceLink = $"admin/rooms/{room.Id}"
				});

				return;
			}
		}

		room.Status = targetStatus;
		_repository.Update(room);
		await _repository.SaveChangesAsync();
	}

	public async Task ChangeRoomCleaningStatusAsync(int id, string newCleaningStatus)
	{
		var room = await _repository.GetByIdAsync(id);
		if (room == null) throw new NotFoundException("Room not found.");

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
}