using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Repositories.Interfaces;

public interface IRoomRepository
{
	Task<IEnumerable<Room>> GetAllAsync();
	Task<Room?> GetByIdAsync(int id);
	Task<bool> IsRoomNumberExistsAsync(string roomNumber);
	Task AddAsync(Room room);
	void Update(Room room);
	void Delete(Room room);
	Task<bool> SaveChangesAsync();
}