namespace HotelManagement.Dtos;

public class ServiceDto
{
    public int Id { get; set; }
    public int? CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? Unit { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public string? Features { get; set; }
    public bool IsActive { get; set; }
}

public class CreateServiceDto
{
    public int? CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Features { get; set; }
    public IFormFile? Image { get; set; }
}

public class UpdateServiceDto
{
    public int? CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Features { get; set; }
    public bool IsActive { get; set; }
    public IFormFile? Image { get; set; }
}

public class ServiceQueryDto
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public string? SortBy { get; set; } // id, price
    public string? SortOrder { get; set; } // asc, desc
    public bool? IsActive { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
