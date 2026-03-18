namespace HotelManagement.Entities;

public class Room
{
    public int Id { get; set; }
    public int? RoomTypeId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public int? Floor { get; set; }
    public string? Status { get; set; }

    public RoomType? RoomType { get; set; }
    public ICollection<RoomInventory> RoomInventories { get; set; } = new List<RoomInventory>();
    public ICollection<BookingDetail> BookingDetails { get; set; } = new List<BookingDetail>();
}
