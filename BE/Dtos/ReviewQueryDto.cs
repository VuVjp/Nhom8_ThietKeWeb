namespace HotelManagement.Dtos;

public class ReviewQueryDto
{
    public string? Search { get; set; } // ID or UserName
    public int? RoomTypeId { get; set; }
    public int? Rating { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? IsActive { get; set; }
    public string? SortBy { get; set; } = "id";
    public string? SortOrder { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
