namespace HotelManagement.Entities;

public class Amenity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public bool IsActive { get; set; } = false;

    public ICollection<RoomTypeAmenity> RoomTypeAmenities { get; set; } = new List<RoomTypeAmenity>();
}
