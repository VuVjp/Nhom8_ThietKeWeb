namespace HotelManagement.Dtos;
public class RoomDto
{
    public int? RoomTypeId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public int? Floor { get; set; }
    public string? Status { get; set; }
    public string? CleaningStatus { get; set; }
}