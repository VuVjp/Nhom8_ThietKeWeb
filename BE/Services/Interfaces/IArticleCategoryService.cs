public interface IArticleCategoryService
{
    Task<IEnumerable<ArticleCategoryDto>> GetAllAsync();
    Task<ArticleCategoryDto?> GetByIdAsync(int id);
    Task<bool> CreateAsync(CreateArticleCategoryDto dto);
    Task<bool> UpdateAsync(int id, UpdateArticleCategoryDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> RestoreAsync(int id);
}