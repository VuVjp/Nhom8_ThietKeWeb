public class CreateRoomInventoryDto
{
    public int? RoomId { get; set; }
    public int? EquipmentId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int? Quantity { get; set; }
    public decimal? PriceIfLost { get; set; }
}