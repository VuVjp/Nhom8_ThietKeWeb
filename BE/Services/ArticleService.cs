using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;
using HotelManagement.Data;
using Microsoft.AspNetCore.Http;

public class ArticleService : IArticleService
{
    private readonly IArticleRepository _repo;
    private readonly IArticleCategoryRepository _categoryRepo;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly AppDbContext _context;

    public ArticleService(
        IArticleRepository repo,
        IArticleCategoryRepository categoryRepo,
        ICloudinaryService cloudinaryService,
        AppDbContext context)
    {
        _repo = repo;
        _categoryRepo = categoryRepo;
        _cloudinaryService = cloudinaryService;
        _context = context;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static ArticleDto MapToDto(Article a) => new()
    {
        Id           = a.Id,
        AuthorId     = a.AuthorId,
        Title        = a.Title,
        Slug         = a.Slug,
        Content      = null, // Omitted in list — use GetByIdAsync for full content
        ThumbnailUrl = a.ThumbnailUrl,
        PublishedAt  = a.PublishedAt,
        AuthorName   = a.Author?.FullName,
        IsActive     = a.IsActive,
        Categories   = a.ArticleCategoryMaps
            .Where(m => m.Category != null)
            .Select(m => new ArticleCategoryDto
            {
                Id       = m.Category!.Id,
                Name     = m.Category.Name,
                IsActive = m.Category.IsActive,
            })
            .ToList(),
    };

    private static ArticleDto MapToDtoWithContent(Article a) => new()
    {
        Id           = a.Id,
        AuthorId     = a.AuthorId,
        Title        = a.Title,
        Slug         = a.Slug,
        Content      = a.Content,
        ThumbnailUrl = a.ThumbnailUrl,
        PublishedAt  = a.PublishedAt,
        AuthorName   = a.Author?.FullName,
        IsActive     = a.IsActive,
        Categories   = a.ArticleCategoryMaps
            .Where(m => m.Category != null)
            .Select(m => new ArticleCategoryDto
            {
                Id       = m.Category!.Id,
                Name     = m.Category.Name,
                IsActive = m.Category.IsActive,
            })
            .ToList(),
    };

    /// <summary>
    /// Validates that all provided IDs correspond to active categories.
    /// Throws <see cref="BadRequestException"/> on the first invalid ID.
    /// </summary>
    private async Task ValidateCategoryIdsAsync(IEnumerable<int> categoryIds)
    {
        foreach (var id in categoryIds)
        {
            var cat = await _categoryRepo.GetByIdAsync(id);
            if (cat == null)
                throw new BadRequestException($"Category with ID {id} does not exist.");
            if (!cat.IsActive)
                throw new BadRequestException($"Category '{cat.Name}' (ID {id}) is inactive and cannot be assigned to an article.");
        }
    }

    /// <summary>
    /// Replaces the entire set of junction rows for an article with the new list.
    /// </summary>
    private async Task SyncCategoryMapsAsync(int articleId, IEnumerable<int> newCategoryIds)
    {
        // Remove existing mappings for this article
        var existing = await _context.Set<ArticleCategoryMap>()
            .Where(m => m.ArticleId == articleId)
            .ToListAsync();
        _context.Set<ArticleCategoryMap>().RemoveRange(existing);

        // Insert the new set (composite PK prevents duplicates at DB level)
        foreach (var catId in newCategoryIds.Distinct())
        {
            await _context.Set<ArticleCategoryMap>().AddAsync(new ArticleCategoryMap
            {
                ArticleId  = articleId,
                CategoryId = catId,
            });
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public async Task<IEnumerable<ArticleDto>> GetAllAsync()
    {
        var data = await _repo.GetAllActiveAsync();
        return data.Select(MapToDto);
    }

    public async Task<ArticleDto?> GetByIdAsync(int id)
    {
        var a = await _repo.GetByIdWithCategoriesAsync(id);
        if (a == null) throw new NotFoundException($"Article with ID {id} not found.");
        return MapToDtoWithContent(a);
    }

    public async Task<bool> CreateAsync(CreateArticleDto dto)
    {
        // Validate that every supplied category ID exists and is active
        if (dto.CategoryIds.Count > 0)
            await ValidateCategoryIdsAsync(dto.CategoryIds);

        var thumbnailUrl = dto.ThumbnailUrl;
        if (dto.ThumbnailFile != null)
            thumbnailUrl = await _cloudinaryService.UploadImageAsync(dto.ThumbnailFile, "articles/thumbnail");

        var entity = new Article
        {
            AuthorId     = dto.AuthorId,
            Title        = dto.Title,
            Content      = dto.Content,
            ThumbnailUrl = thumbnailUrl,
            IsActive     = dto.IsActive ?? true,
        };

        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync(); // entity.Id is now set

        // Insert junction rows
        await SyncCategoryMapsAsync(entity.Id, dto.CategoryIds);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdateAsync(int id, UpdateArticleDto dto)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) throw new NotFoundException($"Article with ID {id} not found.");

        // Validate that every supplied category ID exists and is active
        if (dto.CategoryIds.Count > 0)
            await ValidateCategoryIdsAsync(dto.CategoryIds);

        var thumbnailUrl = entity.ThumbnailUrl;
        if (dto.ThumbnailFile != null)
            thumbnailUrl = await _cloudinaryService.UploadImageAsync(dto.ThumbnailFile, "articles/thumbnail");
        else if (dto.ThumbnailUrl != null)
            thumbnailUrl = string.IsNullOrWhiteSpace(dto.ThumbnailUrl) ? null : dto.ThumbnailUrl;

        if (dto.AuthorId.HasValue)
            entity.AuthorId = dto.AuthorId.Value;
        entity.Title        = dto.Title;
        entity.Content      = dto.Content;
        entity.ThumbnailUrl = thumbnailUrl;
        if (dto.IsActive.HasValue)
            entity.IsActive = dto.IsActive.Value;

        _repo.Update(entity);

        // Replace junction rows atomically
        await SyncCategoryMapsAsync(entity.Id, dto.CategoryIds);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) throw new NotFoundException($"Article with ID {id} not found.");

        entity.IsActive = false;
        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RestoreAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) throw new NotFoundException($"Article with ID {id} not found.");

        entity.IsActive = true;
        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdateThumbnailAsync(int id, UpdateArticleThumbnailDto dto)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) throw new NotFoundException($"Article with ID {id} not found.");

        if (dto.ThumbnailFile != null)
            entity.ThumbnailUrl = await _cloudinaryService.UploadImageAsync(dto.ThumbnailFile, "articles/thumbnail");
        else if (dto.ThumbnailUrl != null)
            entity.ThumbnailUrl = string.IsNullOrWhiteSpace(dto.ThumbnailUrl) ? null : dto.ThumbnailUrl;

        _repo.Update(entity);
        await _repo.SaveChangesAsync();

        return true;
    }

    public async Task<string> UploadImageAsync(IFormFile file)
    {
        return await _cloudinaryService.UploadImageAsync(file, "articles/content");
    }
}