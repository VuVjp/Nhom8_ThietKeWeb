namespace HotelManagement.Entities;

public class ArticleCategoryMap
{
    public int ArticleId { get; set; }
    public int CategoryId { get; set; }

    public Article Article { get; set; } = null!;
    public ArticleCategory Category { get; set; } = null!;
}
