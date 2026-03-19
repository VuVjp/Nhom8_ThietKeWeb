namespace HotelManagement.Entities;

public class RoomInventory
{
    public int Id { get; set; }
    public int? RoomId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int? Quantity { get; set; }
    public decimal? PriceIfLost { get; set; }
    public bool IsActive { get; set; } = true;

    public Room? Room { get; set; }
    public ICollection<LossAndDamage> LossAndDamages { get; set; } = new List<LossAndDamage>();
}
