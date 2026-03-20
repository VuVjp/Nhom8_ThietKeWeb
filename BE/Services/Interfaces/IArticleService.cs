public interface IArticleService
{
    Task<IEnumerable<ArticleDto>> GetAllAsync();
    Task<ArticleDto?> GetByIdAsync(int id);
    Task<bool> CreateAsync(CreateArticleDto dto);
    Task<bool> UpdateAsync(int id, UpdateArticleDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> UpdateThumbnailAsync(int id, UpdateArticleThumbnailDto dto);
}