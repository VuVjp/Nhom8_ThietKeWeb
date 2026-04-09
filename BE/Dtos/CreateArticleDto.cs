public class CreateArticleDto
{
    /// <summary>IDs of active categories to assign to the article (many-to-many).</summary>
    public List<int> CategoryIds { get; set; } = new();
    public int? AuthorId { get; set; }

    [System.ComponentModel.DataAnnotations.MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? ThumbnailUrl { get; set; }
    public IFormFile? ThumbnailFile { get; set; }
    public bool? IsActive { get; set; }
}