using HotelManagement.Data;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Repositories.Implementations;

public class AttractionRepository : IAttractionRepository
{
	private readonly AppDbContext _context;

	public AttractionRepository(AppDbContext context)
	{
		_context = context;
	}

	public async Task<IEnumerable<Attraction>> GetAllAsync()
		=> await _context.Attractions.AsNoTracking().ToListAsync();

	public async Task<Attraction?> GetByIdAsync(int id)
		=> await _context.Attractions.FindAsync(id);

	public async Task AddAsync(Attraction attraction)
		=> await _context.Attractions.AddAsync(attraction);

	public void Update(Attraction attraction)
		=> _context.Attractions.Update(attraction);

	public void Delete(Attraction attraction)
		=> _context.Attractions.Remove(attraction);

	public async Task<bool> SaveChangesAsync()
		=> await _context.SaveChangesAsync() > 0;
}