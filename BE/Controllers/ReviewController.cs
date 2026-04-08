using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _service;

    public ReviewsController(IReviewService service) => _service = service;

    [HttpGet("room/{roomId}")]
    public async Task<IActionResult> GetByRoom(int roomId) 
        => Ok(await _service.GetByRoomIdAsync(roomId));

    [HttpPost]
    public async Task<IActionResult> Create(CreateReviewDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int userId = string.IsNullOrEmpty(userIdClaim) ? 1 : int.Parse(userIdClaim); 

        var result = await _service.CreateAsync(userId, dto);
        return Ok(result);
    }
}