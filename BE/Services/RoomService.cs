using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using HotelManagement.Dtos;

namespace HotelManagement.Services.Implementations;

public class RoomService : IRoomService
{
	private readonly IRoomRepository _repository;

	public RoomService(IRoomRepository repository)
	{
		_repository = repository;
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

		room.Status = newStatus;
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
}