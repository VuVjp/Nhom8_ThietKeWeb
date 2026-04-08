public class InvoiceDto
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

public class CreateInvoiceDto
{
    public int BookingId { get; set; }
    public decimal TotalAmount { get; set; }
}