namespace HotelManagement.Entities;

public class User
{
    public int Id { get; set; }
    public int? RoleId { get; set; }
    public int? MembershipId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string? GoogleId { get; set; }
    public string? AvatarUrl { get; set; }

    public Role? Role { get; set; }
    public Membership? Membership { get; set; }
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public ICollection<Article> Articles { get; set; } = new List<Article>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
