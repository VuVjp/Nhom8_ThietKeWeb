using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class AmenitiesController : ControllerBase
{
    private readonly IAmenityService _service;

    public AmenitiesController(IAmenityService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var data = await _service.GetByIdAsync(id);
        if (data == null) return NotFound();
        return Ok(data);
    }

    [Permission(PermissionNames.CreateAmenity)]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateAmenityRequestDto dto)
    {
        var ok = await _service.CreateAsync(dto);

        if (!ok) return BadRequest();
        return Ok();
    }

    [Permission(PermissionNames.UpdateAmenity)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromForm] UpdateAmenityDto dto)
    {
        var ok = await _service.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        return NoContent();
    }


    [Permission(PermissionNames.DeleteAmenity)]
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var ok = await _service.ToggleActiveAsync(id);
        if (!ok) return NotFound();
        return Ok("Amenity active status toggled successfully.");
    }
}