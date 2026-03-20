using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IAttractionService
{
	Task<IEnumerable<AttractionDto>> GetAllAsync();
	Task<AttractionDto?> GetByIdAsync(int id);
	Task<bool> CreateAsync(CreateAttractionDto dto);
	Task<bool> UpdateAsync(int id, UpdateAttractionDto dto);
	Task<bool> DeleteAsync(int id);
}