namespace HotelManagement.Entities;

public class Article
{
    public int Id { get; set; }
    public int? AuthorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Content { get; set; }
    public string? ThumbnailUrl { get; set; }
    public DateTime? PublishedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public User? Author { get; set; }
    public ICollection<ArticleCategoryMap> ArticleCategoryMaps { get; set; } = new List<ArticleCategoryMap>();
}
