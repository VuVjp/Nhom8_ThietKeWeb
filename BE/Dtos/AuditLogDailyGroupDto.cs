namespace HotelManagement.Dtos;

public class AuditLogDailyGroupDto
{
    public string Date { get; set; } = string.Empty;
    public int? UserId { get; set; }
    public int TotalEvents { get; set; }
    public List<AuditLogEventDto> Events { get; set; } = new();
}
