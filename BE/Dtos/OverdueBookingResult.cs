namespace HotelManagement.Dtos;

public class OverdueBookingResult
{
    public List<int> PendingBookingIds { get; set; }
    public List<int> ConfirmedBookingIds { get; set; }
}