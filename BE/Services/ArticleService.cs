using HotelManagement.Entities;

public class ArticleService : IArticleService
{
    private readonly IArticleRepository _repo;
    private readonly ICloudinaryService _cloudinaryService;

    public ArticleService(IArticleRepository repo, ICloudinaryService cloudinaryService)
    {
        _repo = repo;
        _cloudinaryService = cloudinaryService;
    }

    public async Task<IEnumerable<ArticleDto>> GetAllAsync()
    {
        var data = await _repo.GetAllActiveAsync();

        Console.Error.WriteLine($"[ArticleService] GetAllAsync: Retrieved {data.Count()} articles from repository.");
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
    public async Task<bool> CreateAsync(CreateArticleDto dto)
    {
        var thumbnailUrl = dto.ThumbnailUrl;
        if (dto.ThumbnailFile != null)
        {
            thumbnailUrl = await _cloudinaryService.UploadImageAsync(dto.ThumbnailFile, "articles/thumbnail", dto.Title);
        }

        var entity = new Article
        {
            CategoryId = dto.CategoryId,
            AuthorId = dto.AuthorId,
            Title = dto.Title,
            Content = dto.Content,
            ThumbnailUrl = thumbnailUrl
        };

        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdateAsync(int id, UpdateArticleDto dto)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null || !entity.IsActive) throw new NotFoundException($"Article with ID {id} not found.");

        var thumbnailUrl = entity.ThumbnailUrl;
        if (dto.ThumbnailFile != null)
        {
            thumbnailUrl = await _cloudinaryService.UploadImageAsync(dto.ThumbnailFile, "articles/thumbnail", dto.Title);
        }
        else if (!string.IsNullOrWhiteSpace(dto.ThumbnailUrl))
        {
            thumbnailUrl = dto.ThumbnailUrl;
        }

        entity.CategoryId = dto.CategoryId;
        entity.AuthorId = dto.AuthorId;
        entity.Title = dto.Title;
        entity.Content = dto.Content;
        entity.ThumbnailUrl = thumbnailUrl;

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

        if (dto.ThumbnailFile != null)
        {
            entity.ThumbnailUrl = await _cloudinaryService.UploadImageAsync(dto.ThumbnailFile, "articles/thumbnail", $"article-{id}");
        }
        else if (!string.IsNullOrWhiteSpace(dto.ThumbnailUrl))
        {
            entity.ThumbnailUrl = dto.ThumbnailUrl;
        }

        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }
}