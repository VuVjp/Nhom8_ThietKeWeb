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
    public string? InvoiceCode { get; set; }
    public decimal? TotalLossDamageAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? CompletedAt { get; set; }
    public string? Status { get; set; }

    public Booking? Booking { get; set; }
    public ICollection<BookingDetail> BookingDetails { get; set; } = new List<BookingDetail>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
