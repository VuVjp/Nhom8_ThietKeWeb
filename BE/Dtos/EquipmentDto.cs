namespace HotelManagement.Dtos;

using Microsoft.AspNetCore.Http;

public class EquipmentDto
{
    public int Id { get; set; }
    public string? ItemCode { get; set; }
    public string? Name { get; set; }
    public string? Category { get; set; }
    public string? Unit { get; set; }
    public int TotalQuantity { get; set; }
    public int InUseQuantity { get; set; }
    public int DamagedQuantity { get; set; }
    public int LiquidatedQuantity { get; set; }
    public decimal BasePrice { get; set; }
    public decimal DefaultPriceIfLost { get; set; }
    public string? Supplier { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? ImageUrl { get; set; }

    // Computed property: Available quantity for assignment
    public int AvailableQuantity => TotalQuantity - InUseQuantity - DamagedQuantity - LiquidatedQuantity;
}

public class CreateEquipmentDto
{
    public string? ItemCode { get; set; }
    public string? Name { get; set; }
    public string? Category { get; set; }
    public string? Unit { get; set; }
    public int TotalQuantity { get; set; }
    public decimal BasePrice { get; set; }
    public decimal DefaultPriceIfLost { get; set; }
    public string? Supplier { get; set; }
    public IFormFile? File { get; set; }
}

public class UpdateEquipmentDto
{
    public string? Name { get; set; }
    public string? Category { get; set; }
    public string? Unit { get; set; }
    public int? TotalQuantity { get; set; }
    public int? InUseQuantity { get; set; }
    public int? DamagedQuantity { get; set; }
    public int? LiquidatedQuantity { get; set; }
    public decimal? BasePrice { get; set; }
    public decimal? DefaultPriceIfLost { get; set; }
    public string? Supplier { get; set; }
    public bool? IsActive { get; set; }
    public string? ImageUrl { get; set; }
    public IFormFile? File { get; set; }
}
