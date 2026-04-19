namespace HotelManagement.Dtos;

public class AuditLogCreateDto
{
    public int? UserId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int? RecordId { get; set; }
    public Dictionary<string, object?> Context { get; set; } = new();
    public object? OldData { get; set; }
    public object? NewData { get; set; }
    public string Message { get; set; } = string.Empty;
}
