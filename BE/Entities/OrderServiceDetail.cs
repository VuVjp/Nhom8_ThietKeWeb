namespace HotelManagement.Entities;

public class OrderServiceDetail
{
    public int Id { get; set; }
    public int? OrderServiceId { get; set; }
    public int? ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string Unit { get; set; } = string.Empty;

    public OrderService? OrderService { get; set; }
    public Service? Service { get; set; }
}
