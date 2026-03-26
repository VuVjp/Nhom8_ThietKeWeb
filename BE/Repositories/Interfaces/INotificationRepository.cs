using HotelManagement.Entities;

public interface INotificationRepository
{
    Task AddRangeAsync(List<Notification> notifications);
    Task AddAsync(Notification notification);
    Task<List<Notification>> GetByUserIdAsync(int userId);
    Task<int> CountUnreadAsync(int userId);
}