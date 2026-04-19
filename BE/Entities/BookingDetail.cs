namespace HotelManagement.Entities;

public class BookingDetail
{
    public int Id { get; set; }
    public int? BookingId { get; set; }
    public int? RoomId { get; set; }
    public int? RoomTypeId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public DateTime? ActualCheckOutDate { get; set; }
    public decimal PricePerNight { get; set; }
    public int? InvoiceId { get; set; }

    public Booking? Booking { get; set; }
    public Room? Room { get; set; }
    public RoomType? RoomType { get; set; }
    public Invoice? Invoice { get; set; }
    public ICollection<OrderService> OrderServices { get; set; } = new List<OrderService>();
    public ICollection<LossAndDamage> LossAndDamages { get; set; } = new List<LossAndDamage>();
}
