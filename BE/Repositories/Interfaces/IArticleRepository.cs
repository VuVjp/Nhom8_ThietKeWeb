using HotelManagement.Entities;

public interface IArticleRepository : IRepository<Article>
{
    Task<IEnumerable<Article>> GetAllActiveAsync();
    Task<Article?> GetByIdWithCategoriesAsync(int id);
}