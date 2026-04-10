namespace HotelManagement.Dtos;

public class RoomAvailabilityDto
{
    public int RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string RoomTypeName { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
}

public class CreateBookingDto
{
    public string? VoucherId { get; set; }
    public bool IsExistingGuest { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string GuestPhone { get; set; } = string.Empty;
    public string? GuestEmail { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public List<int> RoomIds { get; set; } = new();
    public decimal TotalAmount { get; set; }
    public string InvoiceType { get; set; } = "Consolidated";
}

public class UpdateBookingDto
{
    public string? GuestName { get; set; } = string.Empty;
    public string? GuestPhone { get; set; } = string.Empty;
    public string? GuestEmail { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public List<int> RoomIds { get; set; } = new();
    public string InvoiceType { get; set; } = "Consolidated";
}

public class ActiveRoomDto
{
    public int BookingDetailId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public int BookingId { get; set; }
}

public class BookingSummaryDto
{
    public int Id { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string GuestPhone { get; set; } = string.Empty;
    public string? GuestEmail { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public List<int> RoomIds { get; set; } = new();
}