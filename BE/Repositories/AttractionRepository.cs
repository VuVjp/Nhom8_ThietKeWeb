using HotelManagement.Data;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Repositories;

public class AttractionRepository : Repository<Attraction>, IAttractionRepository
{
	public AttractionRepository(AppDbContext context) : base(context)
	{
	}

	public async Task<IEnumerable<Attraction>> GetAllActiveAsync()
	{
		return await _context.Attractions.Where(a => a.IsActive).ToListAsync();
	}
}
