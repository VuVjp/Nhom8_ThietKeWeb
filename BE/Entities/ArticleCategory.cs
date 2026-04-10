namespace HotelManagement.Entities;

public class ArticleCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    /// <summary>Navigation for the many-to-many relationship with Article.</summary>
    public ICollection<ArticleCategoryMap> ArticleCategoryMaps { get; set; } = new List<ArticleCategoryMap>();
}
