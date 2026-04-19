namespace HotelManagement.Dtos;

public class InvoiceDto
{
    public int Id { get; set; }
    public int? BookingId { get; set; }
    public string? InvoiceCode { get; set; }
    public string? GuestName { get; set; }
    public string? BookingCode { get; set; }
    public decimal TotalRoomAmount { get; set; }
    public decimal TotalServiceAmount { get; set; }
    public decimal TotalLossDamageAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal FinalTotal { get; set; }
    public string? Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsSplit { get; set; }
    public string? RoomNumber { get; set; }
}

public class InvoiceDetailDto : InvoiceDto
{
    public List<InvoiceRoomDetailDto> RoomDetails { get; set; } = new();
    public List<InvoiceServiceDetailDto> ServiceDetails { get; set; } = new();
    public List<InvoiceLossDamageDetailDto> LossDamageDetails { get; set; } = new();
}

public class InvoiceRoomDetailDto
{
    public int Id { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string RoomType { get; set; } = string.Empty;
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public DateTime? ActualCheckOut { get; set; }
    public decimal PricePerNight { get; set; }
    public decimal Subtotal { get; set; }
}

public class InvoiceServiceDetailDto
{
    public string ServiceName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal Total { get; set; }
    public DateTime OrderDate { get; set; }
}

public class InvoiceLossDamageDetailDto
{
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal PenaltyAmount { get; set; }
    public string? Description { get; set; }
}
