using HotelManagement.Enums;

namespace HotelManagement.Entities;

public class OrderService
{
    public int Id { get; set; }
    public int? BookingDetailId { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.Now;
    public decimal TotalAmount { get; set; }
    public OrderServiceStatus Status { get; set; } = OrderServiceStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }

    public BookingDetail? BookingDetail { get; set; }
    public ICollection<OrderServiceDetail> OrderServiceDetails { get; set; } = new List<OrderServiceDetail>();
}
