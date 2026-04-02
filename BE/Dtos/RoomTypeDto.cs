namespace HotelManagement.Dtos;

public class RoomTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public int CapacityAdults { get; set; }
    public int CapacityChildren { get; set; }
    public string? Description { get; set; }

    public List<AmenityDto> Amenities { get; set; } = new();
    public List<RoomImageDto> RoomImages { get; set; } = new();
}
