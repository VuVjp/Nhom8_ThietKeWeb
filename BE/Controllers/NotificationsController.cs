using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpPost("mark-all-as-read")]  
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        if (userId <= 0)
        {
            return Unauthorized();
        }

        await _notificationService.MarkAllAsReadAsync(userId);
        return NoContent();
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        if (userId <= 0)
        {
            return Unauthorized();
        }

        var notifications = await _notificationService.GetNotificationsByUserIdAsync(userId, page, pageSize);
        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        if (userId <= 0)
        {
            return Unauthorized();
        }

        var count = await _notificationService.CountUnreadNotificationsAsync(userId);
        return Ok(new { count });
    }

    [HttpPatch("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(int notificationId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        if (userId <= 0)
        {
            return Unauthorized();
        }

        await _notificationService.MarkAsReadAsync(notificationId, userId);
        return NoContent();
    }
}
