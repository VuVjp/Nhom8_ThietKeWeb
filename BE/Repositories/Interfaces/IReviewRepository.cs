using HotelManagement.Entities;

namespace HotelManagement.Repositories.Interfaces;

public interface IReviewRepository : IRepository<Review>
{
    Task<IEnumerable<Review>> GetAllWithDetailsAsync();
    Task<Review?> GetByIdWithDetailsAsync(int id);
    IQueryable<Review> GetQueryable();
}
