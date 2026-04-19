using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MembershipsController : ControllerBase
{
    private readonly IMembershipService _service;

    public MembershipsController(IMembershipService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound("Không tìm thấy hạng thành viên.");
        return Ok(result);
    }

    // You can enforce permissions if needed: [Permission(PermissionNames.ManageMemberships)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMembershipDto dto)
    {
        var success = await _service.CreateAsync(dto);
        if (!success) return BadRequest("Tạo hạng thành viên thất bại.");
        return Ok("Tạo hạng thành viên thành công.");
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMembershipDto dto)
    {
        var success = await _service.UpdateAsync(id, dto);
        if (!success) return NotFound("Cập nhật thất bại hoặc không tìm thấy hạng thành viên.");
        return Ok("Cập nhật thành công.");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success) return NotFound("Xóa thất bại hoặc không tìm thấy hạng thành viên.");
        return Ok("Xóa thành công.");
    }
}
