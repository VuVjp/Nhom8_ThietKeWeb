using HotelManagement.Dtos;

public interface INotificationService
{
    Task MarkAllAsReadAsync(int userId);
    Task SendByRoleAsync(RoleName role, CreateNotificationDto dto);
    Task<PaginatedResultDto<NotificationResponseDto>> GetNotificationsByUserIdAsync(int userId, int page, int pageSize);
    Task<int> CountUnreadNotificationsAsync(int userId);
    Task MarkAsReadAsync(int notificationId, int userId);
}