using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Route("api/[controller]")]
[ApiController]
public class ReviewController : ControllerBase
{
    private readonly MyDbContext _context;

    public ReviewController(MyDbContext context)
    {
        _context = context;
    }

    // 1. Gửi đánh giá mới
    [HttpPost("submit")]
    public async Task<IActionResult> SubmitReview([FromBody] ReviewRequest req)
    {
        try 
        {
            // Khi thực hiện INSERT, Trigger trg_validate_review trong SQL sẽ tự chạy
            var sql = @"INSERT INTO reviews (booking_id, user_id, room_id, rating_overall, comment, status) 
                        VALUES ({0}, {1}, {2}, {3}, {4}, 'approved')";
            
            await _context.Database.ExecuteSqlRawAsync(sql, req.BookingId, req.UserId, req.RoomId, req.Rating, req.Comment);
            return Ok(new { Message = "Cảm ơn bạn đã đánh giá!" });
        }
        catch (Exception ex)
        {
            // Nếu Trigger SIGNAL SQLSTATE '45000' thì lỗi sẽ được bắt ở đây
            return BadRequest(new { Message = "Không thể đánh giá: " + ex.Message });
        }
    }

    // 2. Lấy điểm sao trung bình của phòng (Lấy từ View view_room_ratings)
    [HttpGet("room-ratings")]
    public async Task<IActionResult> GetRoomRatings()
    {
        // view_room_ratings là View bạn đã tạo trong SQL
        var ratings = await _context.Database.SqlQueryRaw<RoomRatingDTO>(
            "SELECT * FROM view_room_ratings").ToListAsync();
            
        return Ok(ratings);
    }

    // 3. Admin ẩn/hiện đánh giá
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "UPDATE reviews SET status = {0} WHERE id = {1}", status, id);
        return Ok(new { Message = "Đã cập nhật trạng thái đánh giá" });
    }
}