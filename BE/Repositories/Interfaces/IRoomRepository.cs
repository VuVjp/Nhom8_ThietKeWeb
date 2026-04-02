using HotelManagement.Dtos;
using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Repositories.Interfaces;

public interface IRoomRepository
{
	Task<IEnumerable<Room>> GetAllAsync();
	Task<IEnumerable<Room>> GetByStatusAsync(string status);
	Task<Room?> GetByIdAsync(int id);
	Task<bool> IsRoomNumberExistsAsync(string roomNumber);
	Task AddAsync(Room room);
	void Update(Room room);
	void Delete(Room room);
	Task<bool> SaveChangesAsync();
}