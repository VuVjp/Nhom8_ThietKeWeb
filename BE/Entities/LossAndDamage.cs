namespace HotelManagement.Entities;

public class LossAndDamage
{
    public int Id { get; set; }
    public int? BookingDetailId { get; set; }
    public int? RoomInventoryId { get; set; }
    public int Quantity { get; set; }
    public decimal PenaltyAmount { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? CreatedAt { get; set; }

    public BookingDetail? BookingDetail { get; set; }
    public RoomInventory? RoomInventory { get; set; }
}
