namespace HotelManagement.Entities;

public class RoomImage
{
    public int Id { get; set; }
    public int? RoomTypeId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool? IsPrimary { get; set; }

    public RoomType? RoomType { get; set; }
}
