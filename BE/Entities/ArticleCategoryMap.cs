namespace HotelManagement.Entities;

/// <summary>
/// Junction entity for the many-to-many relationship between Article and ArticleCategory.
/// </summary>
public class ArticleCategoryMap
{
    public int ArticleId { get; set; }
    public int CategoryId { get; set; }

    public Article Article { get; set; } = null!;
    public ArticleCategory Category { get; set; } = null!;
}
