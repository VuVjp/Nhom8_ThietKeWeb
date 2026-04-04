using Microsoft.AspNetCore.Mvc;
using HotelManagement.Dtos;

[ApiController]
[Route("api/[controller]")]
public class EquipmentsController : ControllerBase
{
    private readonly IEquipmentService _service;

    public EquipmentsController(IEquipmentService service)
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
        return Ok(await _service.GetByIdAsync(id));
    }

    [Permission(PermissionNames.ManageEquipments)]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateEquipmentDto dto)
    {
        var ok = await _service.CreateAsync(dto);
        if (!ok)
        {
            return BadRequest();
        }
        return Ok();
    }

    [Permission(PermissionNames.ManageEquipments)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromForm] UpdateEquipmentDto dto)
    {
        var ok = await _service.UpdateAsync(id, dto);
        
        if (!ok)
        {
            return NotFound();
        }

        return NoContent();
    }

    [Permission(PermissionNames.ManageEquipments)]
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var ok = await _service.ToggleActiveAsync(id);
        if (!ok)
        {
            return NotFound();
        }

        return Ok("Equipment active status toggled successfully.");
    }
}
