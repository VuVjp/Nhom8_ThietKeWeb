namespace HotelManagement.Dtos;

public class AuditLogEventDto
{
    public string EventId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Dictionary<string, object?> Context { get; set; } = new();
    public AuditLogChangesDto Changes { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}
