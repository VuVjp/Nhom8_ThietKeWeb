namespace HotelManagement.Entities;

public class Payment
{
    public int Id { get; set; }
    public int? InvoiceId { get; set; }
    public int? BookingId { get; set; }
    public string? PaymentMethod { get; set; }
    public decimal AmountPaid { get; set; }
    public string? TransactionCode { get; set; }
    public string? MomoOrderId { get; set; }
    public string? RequestId { get; set; }
    public string? PaymentForType { get; set; } // booking | invoice
    public string? Status { get; set; } // Pending | Completed | Failed
    public string? RawIpn { get; set; }
    public DateTime? PaymentDate { get; set; }

    public Invoice? Invoice { get; set; }
    public Booking? Booking { get; set; }
}
