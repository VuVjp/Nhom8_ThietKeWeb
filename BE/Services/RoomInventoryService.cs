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
	private readonly IEquipmentRepository _equipmentRepository;

	public RoomInventoryService(IRoomInventoryRepository repository, IEquipmentRepository equipmentRepository)
	{
		_repository = repository;
		_equipmentRepository = equipmentRepository;
	}

	public async Task<IEnumerable<RoomInventoryDto>> GetInventoriesAsync()
	{
		var inventories = await _repository.GetAllAsync();
		return inventories.Select(i => new RoomInventoryDto
		{
			Id = i.Id,
			RoomId = i.RoomId,
			EquipmentId = i.EquipmentId,
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
			EquipmentId = i.EquipmentId,
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
			EquipmentId = inventory.EquipmentId,
			ItemName = inventory.ItemName,
			Quantity = inventory.Quantity,
			PriceIfLost = inventory.PriceIfLost
		};
	}

	public async Task<bool> AddItemAsync(CreateRoomInventoryDto dto)
	{
		if (!dto.RoomId.HasValue)
			throw new ArgumentException("Room ID is required.");

		if (!dto.Quantity.HasValue || dto.Quantity.Value <= 0)
			throw new ArgumentException("Quantity must be greater than 0.");

		if (string.IsNullOrWhiteSpace(dto.ItemName))
			throw new ArgumentException("Item name is required.");

		Equipment? equipment = null;

		// Validate equipment if provided
		if (dto.EquipmentId.HasValue)
		{
			equipment = await _equipmentRepository.GetByIdAsync(dto.EquipmentId.Value);
			if (equipment == null || !equipment.IsActive)
				throw new NotFoundException($"Equipment with ID {dto.EquipmentId.Value} not found or is inactive.");

			// Calculate available quantity
			int availableQuantity = equipment.TotalQuantity - equipment.InUseQuantity - equipment.DamagedQuantity - equipment.LiquidatedQuantity;
			if (availableQuantity < dto.Quantity.Value)
				throw new ArgumentException($"Not enough available quantity. Available: {availableQuantity}, Requested: {dto.Quantity.Value}");
		}

		var duplicated = await _repository.GetActiveByRoomAndItemNameAsync(dto.RoomId.Value, dto.ItemName);
		if (duplicated != null)
			throw new ConflictException("This item already exists in room inventory.");

		var inventory = new RoomInventory
		{
			RoomId = dto.RoomId,
			EquipmentId = dto.EquipmentId,
			ItemName = dto.ItemName.Trim(),
			Quantity = dto.Quantity,
			PriceIfLost = dto.PriceIfLost
		};

		await _repository.AddAsync(inventory);
		await _repository.SaveChangesAsync();

		// Update equipment InUseQuantity if equipment is provided
		if (equipment != null)
		{
			equipment.InUseQuantity += dto.Quantity.Value;
			_equipmentRepository.Update(equipment);
			await _equipmentRepository.SaveChangesAsync();
		}

		return true;
	}

	public async Task<bool> UpdateItemAsync(int id, UpdateRoomInventoryDto dto)
	{
		var existing = await _repository.GetByIdAsync(id);
		if (existing == null) return false;

		if (!dto.RoomId.HasValue)
			throw new ArgumentException("Room ID is required.");

		if (!dto.Quantity.HasValue || dto.Quantity.Value <= 0)
			throw new ArgumentException("Quantity must be greater than 0.");

		if (string.IsNullOrWhiteSpace(dto.ItemName))
			throw new ArgumentException("Item name is required.");

		var duplicated = await _repository.GetActiveByRoomAndItemNameAsync(dto.RoomId.Value, dto.ItemName, id);
		if (duplicated != null)
			throw new ConflictException("This item already exists in room inventory.");

		// Only handle equipment tracking if equipment ID is provided
		if (dto.EquipmentId.HasValue)
		{
			// If equipment changed, handle both old and new equipment
			if (existing.EquipmentId != dto.EquipmentId)
			{
				// Decrease old equipment's InUseQuantity
				if (existing.EquipmentId.HasValue)
				{
					var oldEquipment = await _equipmentRepository.GetByIdAsync(existing.EquipmentId.Value);
					if (oldEquipment != null)
					{
						oldEquipment.InUseQuantity -= existing.Quantity ?? 0;
						if (oldEquipment.InUseQuantity < 0) oldEquipment.InUseQuantity = 0;
						_equipmentRepository.Update(oldEquipment);
						await _equipmentRepository.SaveChangesAsync();
					}
				}

				// Validate and increase new equipment's InUseQuantity
				var newEquipment = await _equipmentRepository.GetByIdAsync(dto.EquipmentId.Value);
				if (newEquipment == null || !newEquipment.IsActive)
					throw new NotFoundException($"Equipment with ID {dto.EquipmentId.Value} not found or is inactive.");

				int availableQuantity = newEquipment.TotalQuantity - newEquipment.InUseQuantity - newEquipment.DamagedQuantity - newEquipment.LiquidatedQuantity;
				if (availableQuantity < dto.Quantity.Value)
					throw new ArgumentException($"Not enough available quantity. Available: {availableQuantity}, Requested: {dto.Quantity.Value}");

				newEquipment.InUseQuantity += dto.Quantity.Value;
				_equipmentRepository.Update(newEquipment);
				await _equipmentRepository.SaveChangesAsync();
			}
			else if (existing.Quantity != dto.Quantity && existing.EquipmentId.HasValue)
			{
				// Same equipment, but quantity changed
				var equipment = await _equipmentRepository.GetByIdAsync(existing.EquipmentId.Value);
				if (equipment == null || !equipment.IsActive)
					throw new NotFoundException($"Equipment with ID {existing.EquipmentId.Value} not found or is inactive.");

				int quantityDifference = dto.Quantity.Value - (existing.Quantity ?? 0);
				if (quantityDifference > 0)
				{
					// Need more quantity
					int availableQuantity = equipment.TotalQuantity - equipment.InUseQuantity - equipment.DamagedQuantity - equipment.LiquidatedQuantity;
					if (availableQuantity < quantityDifference)
						throw new ArgumentException($"Not enough available quantity. Available: {availableQuantity}, Additional requested: {quantityDifference}");
				}

				equipment.InUseQuantity += quantityDifference;
				if (equipment.InUseQuantity < 0) equipment.InUseQuantity = 0;
				_equipmentRepository.Update(equipment);
				await _equipmentRepository.SaveChangesAsync();
			}
		}

		existing.ItemName = dto.ItemName.Trim();
		existing.Quantity = dto.Quantity;
		existing.PriceIfLost = dto.PriceIfLost;
		existing.RoomId = dto.RoomId;

		// Only update EquipmentId if provided
		if (dto.EquipmentId.HasValue)
		{
			existing.EquipmentId = dto.EquipmentId;
		}

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

			// If item has equipment reference, validate availability
			if (item.EquipmentId.HasValue)
			{
				var equipment = await _equipmentRepository.GetByIdAsync(item.EquipmentId.Value);
				if (equipment == null || !equipment.IsActive)
					throw new NotFoundException($"Equipment with ID {item.EquipmentId.Value} not found or is inactive.");

				int availableQuantity = equipment.TotalQuantity - equipment.InUseQuantity - equipment.DamagedQuantity - equipment.LiquidatedQuantity;
				if (availableQuantity < (item.Quantity ?? 0))
					throw new ArgumentException($"Not enough available quantity for '{item.ItemName}'. Available: {availableQuantity}, Requested: {item.Quantity}");

				// Increment equipment InUseQuantity
				equipment.InUseQuantity += item.Quantity ?? 0;
				_equipmentRepository.Update(equipment);
				await _equipmentRepository.SaveChangesAsync();
			}

			var newClone = new RoomInventory
			{
				ItemName = item.ItemName,
				Quantity = item.Quantity,
				PriceIfLost = item.PriceIfLost,
				RoomId = newRoomId,
				EquipmentId = item.EquipmentId
			};

			await _repository.AddAsync(newClone);
		}
		await _repository.SaveChangesAsync();
	}

	public async Task<bool> RemoveItemAsync(int id)
	{
		var entity = await _repository.GetByIdAsync(id);
		if (entity == null || !entity.IsActive) throw new NotFoundException($"Room inventory item with ID {id} not found.");

		// If item has equipment reference, decrement InUseQuantity
		if (entity.EquipmentId.HasValue)
		{
			var equipment = await _equipmentRepository.GetByIdAsync(entity.EquipmentId.Value);
			if (equipment != null)
			{
				equipment.InUseQuantity -= entity.Quantity ?? 0;
				if (equipment.InUseQuantity < 0) equipment.InUseQuantity = 0;
				_equipmentRepository.Update(equipment);
				await _equipmentRepository.SaveChangesAsync();
			}
		}

		entity.IsActive = false;
		_repository.Update(entity);
		await _repository.SaveChangesAsync();

		return true;
	}
}