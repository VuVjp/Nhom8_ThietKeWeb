namespace HotelManagement.Entities;

public class Payment
{
    public int Id { get; set; }
    public int? InvoiceId { get; set; }
    public string? PaymentMethod { get; set; }
    public decimal AmountPaid { get; set; }
    public string? TransactionCode { get; set; }
    public DateTime? PaymentDate { get; set; }

    public Invoice? Invoice { get; set; }
}
