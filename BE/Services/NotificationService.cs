using HotelManagement.Dtos;
using HotelManagement.Entities;
using Microsoft.AspNetCore.SignalR;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;
    private readonly IHubContext<NotificationHub> _hub;
    private readonly IUserRepository _userRepository;

    public NotificationService(
        INotificationRepository repo,
        IHubContext<NotificationHub> hub,
        IUserRepository userRepository)
    {
        _repo = repo;
        _hub = hub;
        _userRepository = userRepository;
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var notifications = await _repo.GetByUserIdAsync(userId);
        foreach (var notification in notifications)
        {
            if (!notification.IsRead)
            {
                notification.IsRead = true;
            }
        }
        await _repo.SaveChangesAsync();
    }
    public async Task SendByRoleAsync(RoleName role, CreateNotificationDto dto)
    {
        var users = await _userRepository.GetUsersByRoleAsync(role.ToString());
        var notifications = new List<Notification>();

        foreach (var user in users)
        {
            notifications.Add(new Notification
            {
                UserId = user.Id,
                Title = dto.Title,
                Content = dto.Content,
                Type = dto.Type,
                ReferenceLink = dto.ReferenceLink,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _repo.AddRangeAsync(notifications);

        await _hub.Clients
            .Group($"role_{role}")
            .SendAsync("ReceiveNotification", new
            {
                dto.Title,
                dto.Content,
                type = dto.Type.ToString(),
                dto.ReferenceLink,
                CreatedAt = DateTime.UtcNow
            });
    }

    public async Task<PaginatedResultDto<NotificationResponseDto>> GetNotificationsByUserIdAsync(int userId, int page, int pageSize)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var notifications = await _repo.GetByUserIdPagedAsync(userId, page, pageSize);
        var total = await _repo.CountByUserIdAsync(userId);

        var items = notifications.Select(n => new NotificationResponseDto
        {
            Id = n.Id,
            Title = n.Title,
            Content = n.Content,
            Type = n.Type,
            ReferenceLink = n.ReferenceLink,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt
        }).ToList();

        return new PaginatedResultDto<NotificationResponseDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<int> CountUnreadNotificationsAsync(int userId)
    {
        return await _repo.CountUnreadAsync(userId);
    }

    public async Task MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _repo.GetByIdAsync(notificationId);
        if (notification != null && !notification.IsRead)
        {
            if (notification.UserId != userId)
            {
                throw new UnauthorizedAccessException("You are not allowed to mark this notification.");
            }

            notification.IsRead = true;
            await _repo.SaveChangesAsync();
        }
    }
}