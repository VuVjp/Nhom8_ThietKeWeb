using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Services.Interfaces;

public interface IAttractionService
{
	Task<IEnumerable<Attraction>> GetAttractionsAsync();
	Task<Attraction?> GetAttractionByIdAsync(int id);
	Task<bool> CreateAttractionAsync(Attraction attraction);
	Task<bool> UpdateAttractionAsync(int id, Attraction attraction);
	Task<bool> DeleteAttractionAsync(int id);
}