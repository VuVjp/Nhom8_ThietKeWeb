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
	private readonly IAmenityRepository _amenityRepository;

	public RoomInventoryService(
		IRoomInventoryRepository repository,
		IEquipmentRepository equipmentRepository,
		IAmenityRepository amenityRepository)
	{
		_repository = repository;
		_equipmentRepository = equipmentRepository;
		_amenityRepository = amenityRepository;
	}

	public async Task<IEnumerable<RoomInventoryDto>> GetInventoriesAsync()
	{
		var inventories = await _repository.GetAllAsync();
		return inventories.Select(i => new RoomInventoryDto
		{
			Id = i.Id,
			RoomId = i.RoomId,
			EquipmentId = i.EquipmentId,
			AmenityId = i.AmenityId,
			ItemName = i.ItemName,
			Quantity = i.Quantity,
			PriceIfLost = i.PriceIfLost,
			IsActive = i.IsActive
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
			AmenityId = i.AmenityId,
			ItemName = i.ItemName,
			Quantity = i.Quantity,
			PriceIfLost = i.PriceIfLost,
			IsActive = i.IsActive
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
			AmenityId = inventory.AmenityId,
			ItemName = inventory.ItemName,
			Quantity = inventory.Quantity,
			PriceIfLost = inventory.PriceIfLost,
			IsActive = inventory.IsActive
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

		if (dto.EquipmentId.HasValue && dto.AmenityId.HasValue)
			throw new ArgumentException("Only one of equipmentId or amenityId can be provided.");

		if (!dto.EquipmentId.HasValue && !dto.AmenityId.HasValue)
			throw new ArgumentException("Either equipmentId or amenityId is required.");

		if (dto.AmenityId.HasValue)
		{
			await EnsureAmenityIsActiveAsync(dto.AmenityId.Value);
		}

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

		var duplicated = await FindItemByRoomAndNameAsync(dto.RoomId.Value, dto.ItemName);
		if (duplicated != null)
			throw new ConflictException("This item already exists in room inventory.");

		var inventory = new RoomInventory
		{
			RoomId = dto.RoomId,
			EquipmentId = dto.EquipmentId,
			AmenityId = dto.AmenityId,
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

		if (dto.EquipmentId.HasValue && dto.AmenityId.HasValue)
			throw new ArgumentException("Only one of equipmentId or amenityId can be provided.");

		if (!dto.EquipmentId.HasValue && !dto.AmenityId.HasValue)
			throw new ArgumentException("Either equipmentId or amenityId is required.");

		if (dto.AmenityId.HasValue)
		{
			await EnsureAmenityIsActiveAsync(dto.AmenityId.Value);
		}

		var duplicated = await FindItemByRoomAndNameAsync(dto.RoomId.Value, dto.ItemName, id);
		if (duplicated != null)
			throw new ConflictException("This item already exists in room inventory.");

		// Sync old equipment usage when switching away from equipment.
		if (!dto.EquipmentId.HasValue && existing.EquipmentId.HasValue)
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
		existing.AmenityId = dto.AmenityId;

		existing.EquipmentId = dto.EquipmentId;

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

			if (!item.EquipmentId.HasValue && item.AmenityId.HasValue)
			{
				await EnsureAmenityIsActiveAsync(item.AmenityId.Value);
			}

			var duplicated = await FindItemByRoomAndNameAsync(newRoomId, item.ItemName);
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
				EquipmentId = item.EquipmentId,
				AmenityId = item.AmenityId
			};

			await _repository.AddAsync(newClone);
		}
		await _repository.SaveChangesAsync();
	}

	public async Task<bool> ToggleActiveAsync(int id)
	{
		var entity = await _repository.GetByIdAsync(id);
		if (entity == null) throw new NotFoundException($"Room inventory item with ID {id} not found.");

		// Keep equipment usage in sync when toggling inventory activity.
		if (entity.EquipmentId.HasValue)
		{
			var equipment = await _equipmentRepository.GetByIdAsync(entity.EquipmentId.Value);
			if (equipment != null)
			{
				var quantity = entity.Quantity ?? 0;
				if (entity.IsActive)
				{
					equipment.InUseQuantity -= quantity;
					if (equipment.InUseQuantity < 0) equipment.InUseQuantity = 0;
				}
				else
				{
					if (!equipment.IsActive)
						throw new ConflictException($"Equipment with ID {equipment.Id} is inactive.");

					var availableQuantity = equipment.TotalQuantity - equipment.InUseQuantity - equipment.DamagedQuantity - equipment.LiquidatedQuantity;
					if (availableQuantity < quantity)
						throw new ArgumentException($"Not enough available quantity. Available: {availableQuantity}, Required: {quantity}");

					equipment.InUseQuantity += quantity;
				}

				_equipmentRepository.Update(equipment);
				await _equipmentRepository.SaveChangesAsync();
			}
		}

		entity.IsActive = !entity.IsActive;
		_repository.Update(entity);
		await _repository.SaveChangesAsync();

		return true;
	}

	private static bool IsAmenityInventoryName(string itemName)
	{
		return itemName.Trim().StartsWith("[Amenity]", StringComparison.OrdinalIgnoreCase);
	}

	private static string ExtractAmenityName(string itemName)
	{
		var trimmed = itemName.Trim();
		if (trimmed.StartsWith("[Amenity]", StringComparison.OrdinalIgnoreCase))
		{
			return trimmed.Substring("[Amenity]".Length).Trim();
		}

		return trimmed;
	}

	private async Task EnsureAmenityIsActiveAsync(int amenityId)
	{
		var amenity = await _amenityRepository.GetByIdAsync(amenityId);
		if (amenity == null)
			throw new NotFoundException($"Amenity with ID {amenityId} not found.");

		if (!amenity.IsActive)
			throw new ArgumentException($"Amenity '{amenity.Name}' is inactive.");
	}

	private async Task<RoomInventory?> FindItemByRoomAndNameAsync(int roomId, string itemName, int? excludeId = null)
	{
		var normalized = itemName.Trim().ToLowerInvariant();
		var items = await _repository.GetByRoomIdAsync(roomId);

		return items.FirstOrDefault(item =>
			(!excludeId.HasValue || item.Id != excludeId.Value) &&
			item.ItemName.Trim().ToLowerInvariant() == normalized);
	}
}