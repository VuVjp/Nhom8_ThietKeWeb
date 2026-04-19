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
        // Only return active categories — inactive ones must not appear in UI selectors.
        return await _dbSet
            .Where(ac => ac.IsActive)
            .OrderBy(ac => ac.Name)
            .ToListAsync();
    }
}
