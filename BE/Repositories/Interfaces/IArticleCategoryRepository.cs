using HotelManagement.Entities;

public interface IArticleCategoryRepository : IRepository<ArticleCategory>
{
    Task<IEnumerable<ArticleCategory>> GetAllActiveAsync();
}