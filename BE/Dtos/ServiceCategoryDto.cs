namespace HotelManagement.Dtos;

public class ServiceCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateServiceCategoryDto
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateServiceCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class ServiceCategoryQueryDto
{
    public string? Search { get; set; }
    public string? SortBy { get; set; } // id, name
    public string? SortOrder { get; set; } // asc, desc
    public bool? IsActive { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
