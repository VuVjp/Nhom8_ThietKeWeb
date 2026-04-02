namespace HotelManagement.Dtos;

public class LossAndDamageDto
{
    public int Id { get; set; }
    public int? RoomInventoryId { get; set; }
    public int? RoomId { get; set; }
    public string? RoomNumber { get; set; }
    public string? ItemName { get; set; }
    public int Quantity { get; set; }
    public decimal PenaltyAmount { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class CreateLossAndDamageDto
{
    public int? RoomInventoryId { get; set; }
    public int Quantity { get; set; }
    public decimal PenaltyAmount { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}