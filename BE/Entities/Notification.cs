namespace HotelManagement.Entities;

public class Notification
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public NotificationAction? Type { get; set; }
    public string? ReferenceLink { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime? CreatedAt { get; set; }

    public User? User { get; set; }
}