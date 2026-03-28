namespace HotelManagement.Entities;

public class Equipment
{
    public int Id { get; set; }
    public string ItemCode { get; set; }
    public string Name { get; set; }
    public string Category { get; set; }
    public string Unit { get; set; }
    public int TotalQuantity { get; set; }
    public int InUseQuantity { get; set; }
    public int DamagedQuantity { get; set; }
    public int LiquidatedQuantity { get; set; }
    public decimal BasePrice { get; set; }
    public decimal DefaultPriceIfLost { get; set; }
    public string Supplier { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string ImageUrl { get; set; }

    // Relationships
    public ICollection<RoomInventory> RoomInventories { get; set; } = new List<RoomInventory>();
}
