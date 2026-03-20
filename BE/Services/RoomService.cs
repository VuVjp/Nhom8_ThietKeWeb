using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace HotelManagement.Services.Implementations;

public class RoomService : IRoomService
{
	private readonly IRoomRepository _repository;

	public RoomService(IRoomRepository repository)
	{
		_repository = repository;
	}

	public async Task<IEnumerable<Room>> GetListAsync() => await _repository.GetAllAsync();

	public async Task<Room?> GetDetailAsync(int id) => await _repository.GetByIdAsync(id);

	public async Task<bool> CreateRoomAsync(Room room)
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

		await _repository.AddAsync(room);
		return await _repository.SaveChangesAsync();
	}

	public async Task<bool> UpdateRoomAsync(int id, Room room)
	{
		var existing = await _repository.GetByIdAsync(id);
		if (existing == null) return false;

		// Cho phép cập nhật nhưng vẫn phải check trùng nếu đổi số phòng
		if (existing.RoomNumber != room.RoomNumber && await _repository.IsRoomNumberExistsAsync(room.RoomNumber))
			throw new ArgumentException("Số phòng mới đã tồn tại.");

		existing.RoomNumber = room.RoomNumber;
		existing.Floor = room.Floor;
		existing.Status = room.Status;
		existing.RoomTypeId = room.RoomTypeId;

		_repository.Update(existing);
		return await _repository.SaveChangesAsync();
	}

	public async Task<bool> DeleteRoomAsync(int id)
	{
		var room = await _repository.GetByIdAsync(id);
		if (room == null) return false;

		_repository.Delete(room);
		return await _repository.SaveChangesAsync();
	}
}