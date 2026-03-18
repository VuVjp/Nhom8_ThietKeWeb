namespace HotelManagement.Entities;

public class Invoice
{
    public int Id { get; set; }
    public int? BookingId { get; set; }
    public decimal? TotalRoomAmount { get; set; }
    public decimal? TotalServiceAmount { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? TaxAmount { get; set; }
    public decimal? FinalTotal { get; set; }
    public string? Status { get; set; }

    public Booking? Booking { get; set; }
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
