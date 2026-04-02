namespace HotelManagement.Dtos;

public class AddRoomTypeAmenityDto
{
    public int AmenityId { get; set; }
}

public class AddRoomTypeAmenitiesDto
{
    public List<int> AmenityIds { get; set; } = new();
}
