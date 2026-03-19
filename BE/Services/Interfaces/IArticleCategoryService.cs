public interface IArticleCategoryService
{
    Task<IEnumerable<ArticleCategoryDto>> GetAllAsync();
    Task<ArticleCategoryDto?> GetByIdAsync(int id);
    Task<ArticleCategoryDto> CreateAsync(CreateArticleCategoryDto dto);
    Task<bool> UpdateAsync(int id, UpdateArticleCategoryDto dto);
    Task<bool> DeleteAsync(int id);
}