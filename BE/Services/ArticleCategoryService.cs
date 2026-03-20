using HotelManagement.Entities;

public class ArticleCategoryService : IArticleCategoryService
{
    private readonly IArticleCategoryRepository _repo;

    public ArticleCategoryService(IArticleCategoryRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<ArticleCategoryDto>> GetAllAsync()
    {
        var data = await _repo.GetAllActiveAsync();

        return data.Select(a => new ArticleCategoryDto
        {
            Id = a.Id,
            Name = a.Name
        });
    }

    public async Task<ArticleCategoryDto?> GetByIdAsync(int id)
    {
        var a = await _repo.GetByIdAsync(id);
        if (a == null || !a.IsActive) throw new NotFoundException($"Article category with ID {id} not found.");

        return new ArticleCategoryDto
        {
            Id = a.Id,
            Name = a.Name
        };
    }

    public async Task<ArticleCategoryDto> CreateAsync(CreateArticleCategoryDto dto)
    {
        var entity = new ArticleCategory
        {
            Name = dto.Name
        };

        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();

        return new ArticleCategoryDto
        {
            Id = entity.Id,
            Name = entity.Name
        };
    }

    public async Task<bool> UpdateAsync(int id, UpdateArticleCategoryDto dto)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive) throw new NotFoundException($"Article category with ID {id} not found.");

        entity.Name = dto.Name;

        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive) throw new NotFoundException($"Article category with ID {id} not found.");

        entity.IsActive = false;
        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }
}