namespace HotelManagement.Dtos;

public class AuditLogQueryDto
{
    public string? ActionType { get; set; }
    public string? EntityType { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
