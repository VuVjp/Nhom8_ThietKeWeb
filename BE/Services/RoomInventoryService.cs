using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace HotelManagement.Services.Implementations;

public class RoomInventoryService : IRoomInventoryService
{
	private readonly IRoomInventoryRepository _repository;

	public RoomInventoryService(IRoomInventoryRepository repository)
	{
		_repository = repository;
	}

	public async Task<IEnumerable<RoomInventoryDto>> GetInventoriesAsync()
	{
		var inventories = await _repository.GetAllAsync();
		return inventories.Select(i => new RoomInventoryDto
		{
			Id = i.Id,
			RoomId = i.RoomId,
			ItemName = i.ItemName,
			Quantity = i.Quantity,
			PriceIfLost = i.PriceIfLost
		});
	}

	public async Task<IEnumerable<RoomInventoryDto>> GetByRoomAsync(int roomId)
	{
		var inventories = await _repository.GetByRoomIdAsync(roomId);
		return inventories.Select(i => new RoomInventoryDto
		{
			Id = i.Id,
			RoomId = i.RoomId,
			ItemName = i.ItemName,
			Quantity = i.Quantity,
			PriceIfLost = i.PriceIfLost
		});
	}

	public async Task<RoomInventoryDto?> GetByIdAsync(int id)
	{
		var inventory = await _repository.GetByIdAsync(id);
		return inventory == null ? null : new RoomInventoryDto
		{
			Id = inventory.Id,
			RoomId = inventory.RoomId,
			ItemName = inventory.ItemName,
			Quantity = inventory.Quantity,
			PriceIfLost = inventory.PriceIfLost
		};
	}

	public async Task<bool> AddItemAsync(CreateRoomInventoryDto dto)
	{
		if (!dto.RoomId.HasValue)
			throw new ArgumentException("Room ID is required.");

		if (string.IsNullOrWhiteSpace(dto.ItemName))
			throw new ArgumentException("Item name is required.");

		var duplicated = await _repository.GetActiveByRoomAndItemNameAsync(dto.RoomId.Value, dto.ItemName);
		if (duplicated != null)
			throw new ConflictException("This item already exists in room inventory.");

		var inventory = new RoomInventory
		{
			RoomId = dto.RoomId,
			ItemName = dto.ItemName.Trim(),
			Quantity = dto.Quantity,
			PriceIfLost = dto.PriceIfLost
		};

		await _repository.AddAsync(inventory);
		return await _repository.SaveChangesAsync();
	}

	public async Task<bool> UpdateItemAsync(int id, UpdateRoomInventoryDto dto)
	{
		var existing = await _repository.GetByIdAsync(id);
		if (existing == null) return false;

		if (!dto.RoomId.HasValue)
			throw new ArgumentException("Room ID is required.");

		if (string.IsNullOrWhiteSpace(dto.ItemName))
			throw new ArgumentException("Item name is required.");

		var duplicated = await _repository.GetActiveByRoomAndItemNameAsync(dto.RoomId.Value, dto.ItemName, id);
		if (duplicated != null)
			throw new ConflictException("This item already exists in room inventory.");

		existing.ItemName = dto.ItemName.Trim();
		existing.Quantity = dto.Quantity;
		existing.PriceIfLost = dto.PriceIfLost;
		existing.RoomId = dto.RoomId;

		_repository.Update(existing);
		return await _repository.SaveChangesAsync();
	}

	public async Task CloneItemAsync(int idClone, int newRoomId)
	{
		var clone = await _repository.GetByRoomIdAsync(idClone);
		if (clone == null) throw new NotFoundException("Item not found.");

		foreach (var item in clone)
		{
			if (string.IsNullOrWhiteSpace(item.ItemName))
				continue;

			var duplicated = await _repository.GetActiveByRoomAndItemNameAsync(newRoomId, item.ItemName);
			if (duplicated != null)
				throw new ConflictException($"Item '{item.ItemName}' already exists in target room inventory.");

			var newClone = new RoomInventory
			{
				ItemName = item.ItemName,
				Quantity = item.Quantity,
				PriceIfLost = item.PriceIfLost,
				RoomId = newRoomId
			};

			await _repository.AddAsync(newClone);
		}
		await _repository.SaveChangesAsync();
	}

	public async Task<bool> RemoveItemAsync(int id)
	{
		var entity = await _repository.GetByIdAsync(id);
		if (entity == null || !entity.IsActive) throw new NotFoundException($"Room inventory item with ID {id} not found.");

		entity.IsActive = false;
		_repository.Update(entity);
		await _repository.SaveChangesAsync();

		return true;
	}
}