using HotelManagement.Entities;

public class ArticleService : IArticleService
{
    private readonly IArticleRepository _repo;

    public ArticleService(IArticleRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<ArticleDto>> GetAllAsync()
    {
        var data = await _repo.GetAllActiveAsync();

        return data.Select(a => new ArticleDto
        {
            Id = a.Id,
            CategoryId = a.CategoryId,
            AuthorId = a.AuthorId,
            Title = a.Title,
            Slug = a.Slug,
            Content = a.Content,
            ThumbnailUrl = a.ThumbnailUrl,
            PublishedAt = a.PublishedAt,
            CategoryName = a.Category?.Name,
            AuthorName = a.Author?.FullName
        });
    }

    public async Task<ArticleDto?> GetByIdAsync(int id)
    {
        var a = await _repo.GetByIdAsync(id);
        if (a == null || !a.IsActive) throw new NotFoundException($"Article with ID {id} not found.");

        return new ArticleDto
        {
            Id = a.Id,
            CategoryId = a.CategoryId,
            AuthorId = a.AuthorId,
            Title = a.Title,
            Slug = a.Slug,
            Content = a.Content,
            ThumbnailUrl = a.ThumbnailUrl,
            PublishedAt = a.PublishedAt,
            CategoryName = a.Category?.Name,
            AuthorName = a.Author?.FullName
        };
    }
    public async Task<ArticleDto> CreateAsync(CreateArticleDto dto)
    {
        var entity = new Article
        {
            CategoryId = dto.CategoryId,
            AuthorId = dto.AuthorId,
            Title = dto.Title,
            Content = dto.Content,
            ThumbnailUrl = dto.ThumbnailUrl
        };

        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();

        return new ArticleDto
        {
            Id = entity.Id,
            CategoryId = entity.CategoryId,
            AuthorId = entity.AuthorId,
            Title = entity.Title,
            Content = entity.Content,
            ThumbnailUrl = entity.ThumbnailUrl,
            PublishedAt = entity.PublishedAt,
            CategoryName = entity.Category?.Name,
            AuthorName = entity.Author?.FullName
        };
    }

    public async Task<bool> UpdateAsync(int id, UpdateArticleDto dto)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive) throw new NotFoundException($"Article with ID {id} not found.");

        entity.CategoryId = dto.CategoryId;
        entity.AuthorId = dto.AuthorId;
        entity.Title = dto.Title;
        entity.Content = dto.Content;
        entity.ThumbnailUrl = dto.ThumbnailUrl;

        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive) throw new NotFoundException($"Article with ID {id} not found.");

        entity.IsActive = false;
        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }
    public async Task<bool> UpdateThumbnailAsync(int id, UpdateArticleThumbnailDto dto)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive) throw new NotFoundException($"Article with ID {id} not found.");

        entity.ThumbnailUrl = dto.ThumbnailUrl;

        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }
}