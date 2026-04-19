namespace HotelManagement.Entities;

public class Membership
{
    public int Id { get; set; }
    public string TierName { get; set; } = string.Empty;
    public int? MinPoints { get; set; }
    public decimal? DiscountPercent { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<User> Users { get; set; } = new List<User>();
}
