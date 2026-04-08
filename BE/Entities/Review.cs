namespace BE.Entities;

public class Review
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int RoomId { get; set; } // Giả định đánh giá theo phòng dựa trên file Room.cs của bạn
    public int Rating { get; set; } // 1-5 sao
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? User { get; set; }
    public Room? Room { get; set; }
}