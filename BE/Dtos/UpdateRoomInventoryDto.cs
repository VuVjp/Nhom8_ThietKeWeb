public class UpdateRoomInventoryDto
{
    public int? RoomId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int? Quantity { get; set; }
    public decimal? PriceIfLost { get; set; }
}