using HotelManagement.Dtos;

public interface INotificationService
{
    Task SendByRoleAsync(RoleName role, CreateNotificationDto dto);
    Task<List<NotificationResponseDto>> GetNotificationsByUserIdAsync(int userId);
    Task<int> CountUnreadNotificationsAsync(int userId);
    Task MarkAsReadAsync(int notificationId);
}