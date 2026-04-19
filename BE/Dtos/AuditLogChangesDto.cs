namespace HotelManagement.Dtos;

public class AuditLogChangesDto
{
    public object? OldData { get; set; }
    public object? NewData { get; set; }
}
