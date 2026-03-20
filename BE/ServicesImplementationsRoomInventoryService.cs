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

	public async Task<IEnumerable<RoomInventory>> GetInventoriesAsync() => await _repository.GetAllAsync();

	public async Task<IEnumerable<RoomInventory>> GetByRoomAsync(int roomId) => await _repository.GetByRoomIdAsync(roomId);

	public async Task<RoomInventory?> GetByIdAsync(int id) => await _repository.GetByIdAsync(id);

	public async Task<bool> AddItemAsync(RoomInventory inventory)
	{
		// LOGIC: Kiểm tra tính hợp lệ của dữ liệu
		if (string.IsNullOrWhiteSpace(inventory.ItemName))
			throw new ArgumentException("Tên vật tư không được để trống.");

		if (inventory.Quantity < 0)
			throw new ArgumentException("Số lượng vật tư không thể nhỏ hơn 0.");

		if (inventory.PriceIfLost < 0)
			throw new ArgumentException("Giá đền bù không thể là số âm.");

		await _repository.AddAsync(inventory);
		return await _repository.SaveChangesAsync();
	}

	public async Task<bool> UpdateItemAsync(int id, RoomInventory inventory)
	{
		var existing = await _repository.GetByIdAsync(id);
		if (existing == null) return false;

		existing.ItemName = inventory.ItemName;
		existing.Quantity = inventory.Quantity;
		existing.PriceIfLost = inventory.PriceIfLost;
		existing.RoomId = inventory.RoomId;

		_repository.Update(existing);
		return await _repository.SaveChangesAsync();
	}

	public async Task<bool> RemoveItemAsync(int id)
	{
		var item = await _repository.GetByIdAsync(id);
		if (item == null) return false;

		_repository.Delete(item);
		return await _repository.SaveChangesAsync();
	}
}