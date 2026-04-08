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
