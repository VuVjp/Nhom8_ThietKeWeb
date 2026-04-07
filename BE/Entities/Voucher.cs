namespace HotelManagement.Entities;

public class Voucher
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public decimal? MinBookingValue { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public int? UsageLimit { get; set; }
    public int UsageCount { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
