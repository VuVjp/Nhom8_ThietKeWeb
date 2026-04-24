namespace HotelManagement.Entities;

public class Service
{
    public int Id { get; set; }
    public int? CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? Unit { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public string? Features { get; set; }
    public bool IsActive { get; set; } = true;

    public ServiceCategory? Category { get; set; }
    public ICollection<OrderServiceDetail> OrderServiceDetails { get; set; } = new List<OrderServiceDetail>();
}
