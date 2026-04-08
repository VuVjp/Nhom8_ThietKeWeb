namespace BE.Entities;

public enum InvoiceStatus
{
    Pending,
    Paid,
    Cancelled
}

public class Invoice
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;

    // Navigation property
    public Booking? Booking { get; set; }
}