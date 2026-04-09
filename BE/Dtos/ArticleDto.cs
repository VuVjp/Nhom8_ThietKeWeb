public class ArticleDto
{
    public int Id { get; set; }
    public int? AuthorId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Content { get; set; }
    public string? ThumbnailUrl { get; set; }

    public DateTime? PublishedAt { get; set; }

    public string? AuthorName { get; set; }
    public bool IsActive { get; set; }

    /// <summary>Active categories assigned to this article.</summary>
    public List<ArticleCategoryDto> Categories { get; set; } = new();
}