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
        .Where(a => a.IsActive)
        .Include(a => a.Category)
        .Include(a => a.Author)
        .ToListAsync();
}
}