using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

public class ArticleRepository : Repository<Article>, IArticleRepository
{
    public ArticleRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Article>> GetAllActiveAsync()
    {
        return await _dbSet
            .Include(a => a.ArticleCategoryMaps)
                .ThenInclude(m => m.Category)
            .Include(a => a.Author)
            .ToListAsync();
    }

    public async Task<Article?> GetByIdWithCategoriesAsync(int id)
    {
        return await _dbSet
            .Include(a => a.ArticleCategoryMaps)
                .ThenInclude(m => m.Category)
            .Include(a => a.Author)
            .FirstOrDefaultAsync(a => a.Id == id);
    }
}