using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

public class ArticleCategoryRepository : Repository<ArticleCategory>, IArticleCategoryRepository
{
    public ArticleCategoryRepository(AppDbContext context) : base(context)
    {
    }
    public async Task<IEnumerable<ArticleCategory>> GetAllActiveAsync()
    {
        return await _dbSet
            .Where(ac => ac.IsActive)
            .Include(ac => ac.Articles)
            .ToListAsync();
    }
}
