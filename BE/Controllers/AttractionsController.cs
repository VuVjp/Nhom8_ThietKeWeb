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
		var result = await _service.GetAttractionsAsync();
		return Ok(result);
	}

	[HttpGet("{id}")]
	public async Task<IActionResult> GetById(int id)
	{
		var result = await _service.GetAttractionByIdAsync(id);
		if (result == null) return NotFound($"Không tìm thấy địa điểm với ID {id}");
		return Ok(result);
	}

	[Permission("manage_attraction")]
	[HttpPost]
	public async Task<IActionResult> Create([FromBody] Attraction attraction)
	{
		try
		{
			var success = await _service.CreateAttractionAsync(attraction);
			if (!success) return BadRequest("Không thể lưu dữ liệu.");
			return CreatedAtAction(nameof(GetById), new { id = attraction.Id }, attraction);
		}
		catch (ArgumentException ex)
		{
			return BadRequest(ex.Message);
		}
	}

	[Permission("manage_attraction")]
	[HttpPut("{id}")]
	public async Task<IActionResult> Update(int id, [FromBody] Attraction attraction)
	{
		var success = await _service.UpdateAttractionAsync(id, attraction);
		if (!success) return NotFound("Cập nhật thất bại hoặc không tìm thấy địa điểm.");
		return NoContent();
	}

	[Permission("manage_attraction")]
	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(int id)
	{
		var success = await _service.DeleteAttractionAsync(id);
		if (!success) return NotFound("Xóa thất bại hoặc không tìm thấy địa điểm.");
		return Ok("Xóa thành công.");
	}
}