using HotelManagement.Data;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Repositories.Implementations;

public class RoomRepository : IRoomRepository
{
	private readonly AppDbContext _context;

	public RoomRepository(AppDbContext context) => _context = context;

	public async Task<IEnumerable<Room>> GetAllAsync()
		=> await _context.Rooms
			.Include(r => r.RoomType) 
			.AsNoTracking()
			.ToListAsync();

	public async Task<Room?> GetByIdAsync(int id)
		=> await _context.Rooms
			.Include(r => r.RoomType)
			.Include(r => r.RoomInventories) 
			.FirstOrDefaultAsync(r => r.Id == id);

	public async Task<bool> IsRoomNumberExistsAsync(string roomNumber)
		=> await _context.Rooms.AnyAsync(r => r.RoomNumber == roomNumber);

	public async Task AddAsync(Room room) => await _context.Rooms.AddAsync(room);

	public void Update(Room room) => _context.Rooms.Update(room);

	public void Delete(Room room) => _context.Rooms.Remove(room);

	public async Task<bool> SaveChangesAsync() => await _context.SaveChangesAsync() > 0;
}