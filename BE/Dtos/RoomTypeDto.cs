namespace HotelManagement.Dtos;

public class RoomTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public int CapacityAdults { get; set; }
    public int CapacityChildren { get; set; }
    public string? Description { get; set; }
    public string? View { get; set; }
    public string? BedType { get; set; }
    public int? SizeM2 { get; set; }
    public bool IsActive { get; set; }

    public List<AmenityDto> Amenities { get; set; } = new();
    public List<RoomImageDto> RoomImages { get; set; } = new();
    public List<EquipmentDto> Equipments { get; set; } = new();
}
