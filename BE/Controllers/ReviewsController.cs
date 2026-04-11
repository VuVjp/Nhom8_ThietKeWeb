using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using HotelManagement.Dtos;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _service;

    public ReviewsController(IReviewService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] ReviewQueryDto query)
    {
        return Ok(await _service.GetPagedAsync(query));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var data = await _service.GetByIdAsync(id);
        if (data == null) return NotFound();
        return Ok(data);
    }

    [Permission(PermissionNames.ManageReviews)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _service.DeleteAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }

    [Permission(PermissionNames.ManageReviews)]
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var ok = await _service.ToggleActiveAsync(id);
        if (!ok) return NotFound();
        return Ok(new { message = "Review active status toggled successfully." });
    }
}
