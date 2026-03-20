using HotelManagement.Data;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Repositories.Implementations;

public class RoomInventoryRepository : IRoomInventoryRepository
{
	private readonly AppDbContext _context;

	public RoomInventoryRepository(AppDbContext context)
	{
		_context = context;
	}

	public async Task<IEnumerable<RoomInventory>> GetAllAsync()
		=> await _context.RoomInventories.Include(ri => ri.Room).ToListAsync();

	public async Task<IEnumerable<RoomInventory>> GetByRoomIdAsync(int roomId)
		=> await _context.RoomInventories.Where(ri => ri.RoomId == roomId).ToListAsync();

	public async Task<RoomInventory?> GetByIdAsync(int id)
		=> await _context.RoomInventories.Include(ri => ri.Room).FirstOrDefaultAsync(ri => ri.Id == id);

	public async Task AddAsync(RoomInventory inventory)
		=> await _context.RoomInventories.AddAsync(inventory);

	public void Update(RoomInventory inventory)
		=> _context.RoomInventories.Update(inventory);

	public void Delete(RoomInventory inventory)
		=> _context.RoomInventories.Remove(inventory);

	public async Task<bool> SaveChangesAsync()
		=> await _context.SaveChangesAsync() > 0;
}