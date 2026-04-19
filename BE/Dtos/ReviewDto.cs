namespace HotelManagement.Dtos;

public class ReviewDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserAvatarUrl { get; set; }
    public int? RoomTypeId { get; set; }
    public string? RoomTypeName { get; set; }
    public int? Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime? CreatedAt { get; set; }
    public bool IsActive { get; set; }
}

public class CreateReviewDto
{
    public int RoomTypeId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
}
