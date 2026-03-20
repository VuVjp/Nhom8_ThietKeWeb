using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Repositories.Interfaces;

public interface IAttractionRepository
{
	Task<IEnumerable<Attraction>> GetAllAsync();
	Task<Attraction?> GetByIdAsync(int id);
	Task AddAsync(Attraction attraction);
	void Update(Attraction attraction);
	void Delete(Attraction attraction);
	Task<bool> SaveChangesAsync();
}