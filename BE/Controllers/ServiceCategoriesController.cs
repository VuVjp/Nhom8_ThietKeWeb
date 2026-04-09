using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiceCategoriesController : ControllerBase
{
    private readonly IServiceCategoryService _service;

    public ServiceCategoriesController(IServiceCategoryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("paged")]
    public async Task<IActionResult> GetPaged([FromQuery] ServiceCategoryQueryDto query)
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

    [Permission(PermissionNames.ManageServices)]
    [HttpPost]
    public async Task<IActionResult> Create(CreateServiceCategoryDto dto)
    {
        var ok = await _service.CreateAsync(dto);
        if (!ok) return BadRequest();
        return Ok();
    }

    [Permission(PermissionNames.ManageServices)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateServiceCategoryDto dto)
    {
        var ok = await _service.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        return NoContent();
    }

    [Permission(PermissionNames.ManageServices)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var ok = await _service.DeleteAsync(id);
            if (!ok) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Permission(PermissionNames.ManageServices)]
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var ok = await _service.ToggleActiveAsync(id);
        if (!ok) return NotFound();
        return Ok(new { message = "Category active status toggled successfully." });
    }

    [Permission(PermissionNames.ManageServices)]
    [HttpPatch("{id}/restore")]
    public async Task<IActionResult> Restore(int id)
    {
        var ok = await _service.RestoreAsync(id);
        if (!ok) return NotFound();
        return Ok(new { message = "Category restored successfully." });
    }
}
