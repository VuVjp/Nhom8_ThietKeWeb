using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VouchersController : ControllerBase
{
    private readonly IVoucherService _service;

    public VouchersController(IVoucherService service)
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
        if (data == null)
        {
            return NotFound();
        }

        return Ok(data);
    }

    [Permission(PermissionNames.ManageVouchers)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVoucherDto dto)
    {
        var ok = await _service.CreateAsync(dto);
        if (!ok)
        {
            return BadRequest();
        }

        return Ok();
    }

    [Permission(PermissionNames.ManageVouchers)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateVoucherDto dto)
    {
        var ok = await _service.UpdateAsync(id, dto);
        if (!ok)
        {
            return NotFound();
        }

        return NoContent();
    }

    [Permission(PermissionNames.ManageVouchers)]
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var ok = await _service.ToggleActiveAsync(id);
        if (!ok)
        {
            return NotFound();
        }

        return Ok("Voucher active status toggled successfully.");
    }
}