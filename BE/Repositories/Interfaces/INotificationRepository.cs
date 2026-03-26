using HotelManagement.Entities;

public interface INotificationRepository
{
    Task AddRangeAsync(List<Notification> notifications);
    Task AddAsync(Notification notification);
    Task<List<Notification>> GetByUserIdAsync(int userId);
    Task<List<Notification>> GetByUserIdPagedAsync(int userId, int page, int pageSize);
    Task<int> CountByUserIdAsync(int userId);
    Task<Notification?> GetByIdAsync(int notificationId);
    Task<int> CountUnreadAsync(int userId);
    Task SaveChangesAsync();
}