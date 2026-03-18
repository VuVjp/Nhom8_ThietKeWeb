namespace HotelManagement.Entities;

public class OrderServiceDetail
{
    public int Id { get; set; }
    public int? OrderServiceId { get; set; }
    public int? ServiceId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    public OrderService? OrderService { get; set; }
    public Service? Service { get; set; }
}
