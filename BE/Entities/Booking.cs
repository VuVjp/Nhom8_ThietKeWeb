namespace HotelManagement.Entities;

public class Booking
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string? GuestName { get; set; }
    public string? GuestPhone { get; set; }
    public string? GuestEmail { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public int? VoucherId { get; set; }
    public string? Status { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal? Discount { get; set; }
    public decimal FinalPrice { get; set; }
    public decimal? Deposit { get; set; }
    public string InvoiceType { get; set; } = "Consolidated"; // Consolidated or Split

    public User? User { get; set; }
    public Voucher? Voucher { get; set; }
    public ICollection<BookingDetail> BookingDetails { get; set; } = new List<BookingDetail>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
