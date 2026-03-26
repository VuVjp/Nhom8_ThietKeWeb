namespace HotelManagement.Dtos;

public class AddRoomImageDto
{
    public string? ImageUrl { get; set; }
    public IFormFile? File { get; set; }
}
