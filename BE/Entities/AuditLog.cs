namespace HotelManagement.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public DateTime AuditDate { get; set; }
    public string EventJson { get; set; } = string.Empty;
    public DateTime? LastUpdatedAt { get; set; }

    public User? User { get; set; }
}
