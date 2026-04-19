namespace HotelManagement.Dtos;

public class OrderServiceQueryDto
{
    public string? Search { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Status { get; set; }
    public string? SortBy { get; set; } // id, amount, date, status
    public string? SortOrder { get; set; } // asc, desc
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
