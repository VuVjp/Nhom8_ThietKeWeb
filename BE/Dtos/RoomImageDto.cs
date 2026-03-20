namespace HotelManagement.Dtos.RoomType;

public class RoomImageDto
{
    public int Id { get; set; }
    public int? RoomTypeId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool? IsPrimary { get; set; }
}
