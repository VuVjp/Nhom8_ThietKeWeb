using HotelManagement.Entities;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttractionsController : ControllerBase
{
	private readonly IAttractionService _service;

	public AttractionsController(IAttractionService service)
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
		if (result == null) return NotFound("Không tìm thấy địa điểm.");
		return Ok(result);
	}

	[Permission(PermissionNames.ManageAttractions)]
	[HttpPost]
	public async Task<IActionResult> Create([FromBody] CreateAttractionDto dto)
	{
		var success = await _service.CreateAsync(dto);
		if (!success) return BadRequest("Tạo địa điểm thất bại.");
		return Ok("Tạo địa điểm thành công.");
	}

	[Permission(PermissionNames.ManageAttractions)]
	[HttpPut("{id}")]
	public async Task<IActionResult> Update(int id, [FromBody] UpdateAttractionDto dto)
	{
		var success = await _service.UpdateAsync(id, dto);
		if (!success) return NotFound("Cập nhật thất bại hoặc không tìm thấy địa điểm.");
		return Ok("Cập nhật thành công.");
	}

	[Permission(PermissionNames.ManageAttractions)]
	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(int id)
	{
		var success = await _service.DeleteAsync(id);
		if (!success) return NotFound("Xóa thất bại hoặc không tìm thấy địa điểm.");
		return Ok("Xóa thành công.");
	}
}