namespace HotelManagement.Entities;

public class ArticleCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public ICollection<Article> Articles { get; set; } = new List<Article>();
}
