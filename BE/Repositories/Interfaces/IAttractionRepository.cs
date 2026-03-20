using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IAttractionRepository : IRepository<Attraction>
{
	Task<IEnumerable<Attraction>> GetAllActiveAsync();
}