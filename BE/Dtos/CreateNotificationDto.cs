namespace HotelManagement.Dtos;

public class CreateNotificationDto
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public NotificationAction? Type { get; set; }
    public string? ReferenceLink { get; set; }
}

public class NotificationResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public NotificationAction? Type { get; set; }
    public string? ReferenceLink { get; set; }
    public bool IsRead { get; set; }
    public DateTime? CreatedAt { get; set; }
}