public class UpdateArticleDto
{
    public int? CategoryId { get; set; }
    public int? AuthorId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? ThumbnailUrl { get; set; }
    public IFormFile? ThumbnailFile { get; set; }
}