using HotelManagement.Enums;

namespace HotelManagement.Dtos;

public class OrderServiceSummaryDto
{
    public int Id { get; set; }
    public int? BookingDetailId { get; set; }
    public string? RoomNumber { get; set; }
    public string? GuestName { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public OrderServiceStatus Status { get; set; }
}

public class OrderServiceDto
{
    public int Id { get; set; }
    public int? BookingDetailId { get; set; }
    public string? RoomNumber { get; set; }
    public string? GuestName { get; set; }
    public string? BookingStatus { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public OrderServiceStatus Status { get; set; }
    public List<OrderServiceDetailDto> Details { get; set; } = new();
}

public class OrderServiceDetailDto
{
    public int Id { get; set; }
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal SubTotal => Quantity * UnitPrice;
}

public class CreateOrderServiceDto
{
    public int BookingDetailId { get; set; }
}

public class AddItemToOrderDto
{
    public int ServiceId { get; set; }
    public int Quantity { get; set; }
}

public class UpdateOrderItemDto
{
    public int Quantity { get; set; }
}
