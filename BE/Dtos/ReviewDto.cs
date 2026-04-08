public class ReviewDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = null!;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateReviewDto
{
    public int RoomId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
}