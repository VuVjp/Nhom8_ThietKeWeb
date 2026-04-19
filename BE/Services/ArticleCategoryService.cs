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
        var data = await _repo.GetAllAsync();

        return data.Select(a => new ArticleCategoryDto
        {
            Id = a.Id,
            Name = a.Name,
            IsActive = a.IsActive
        });
    }

    public async Task<ArticleCategoryDto?> GetByIdAsync(int id)
    {
        var a = await _repo.GetByIdAsync(id);
        if (a == null) throw new NotFoundException($"Article category with ID {id} not found.");

        return new ArticleCategoryDto
        {
            Id = a.Id,
            Name = a.Name,
            IsActive = a.IsActive
        };
    }

    public async Task<bool> CreateAsync(CreateArticleCategoryDto dto)
    {
        var entity = new ArticleCategory
        {
            Name = dto.Name,
            IsActive = dto.IsActive ?? true
        };

        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdateAsync(int id, UpdateArticleCategoryDto dto)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) throw new NotFoundException($"Article category with ID {id} not found.");

        entity.Name = dto.Name;
        if (dto.IsActive.HasValue) 
        {
            entity.IsActive = dto.IsActive.Value;
        }

        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) throw new NotFoundException($"Article category with ID {id} not found.");

        entity.IsActive = false;
        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RestoreAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) throw new NotFoundException($"Article category with ID {id} not found.");

        entity.IsActive = true;
        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }
}