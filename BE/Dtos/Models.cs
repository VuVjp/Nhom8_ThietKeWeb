public class InvoiceRequest {
    public string InvoiceCode { get; set; }
    public int BookingId { get; set; }
    public int CustomerId { get; set; }
}

public class ItemRequest {
    public int InvoiceId { get; set; }
    public string Type { get; set; } // room, food, spa...
    public string Description { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class ReviewRequest {
    public int BookingId { get; set; }
    public int UserId { get; set; }
    public int RoomId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; }
}

public class RoomRatingDTO {
    public int RoomId { get; set; }
    public string RoomNumber { get; set; }
    public int TotalReviews { get; set; }
    public decimal AvgRating { get; set; }
}