using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System;

namespace HotelManagement.Controllers;

public class CreateLossAndDamageWithImageFormDto
{
    public int RoomInventoryId { get; set; }
    public int Quantity { get; set; }
    public decimal PenaltyAmount { get; set; }
    public string? Description { get; set; }
    public IFormFile? File { get; set; }
}

[ApiController]
[Route("api/[controller]")]
public class LossAndDamageController : ControllerBase
{
    private readonly ILossAndDamageService _service;
    private readonly ICloudinaryService _cloudinaryService;

    public LossAndDamageController(ILossAndDamageService service, ICloudinaryService cloudinaryService)
    {
        _service = service;
        _cloudinaryService = cloudinaryService;
    }

    [HttpGet]
    [Permission(PermissionNames.ApproveLoss)]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("room/{roomId}")]
    [Permission(PermissionNames.ApproveLoss)]

    public async Task<IActionResult> GetByRoom(int roomId) => Ok(await _service.GetByRoomAsync(roomId));

    [HttpPost]
    [Consumes("application/json")]
    [Permission(PermissionNames.ApproveLoss)]
    public async Task<IActionResult> Create([FromBody] CreateLossAndDamageDto dto)
    {
        var ok = await _service.CreateAsync(dto);
        return ok ? Ok("Created loss and damage record successfully.") : BadRequest();
    }

    [HttpPost("with-image")]
    [Consumes("multipart/form-data")]
    [Permission(PermissionNames.ApproveLoss)]
    public async Task<IActionResult> CreateWithImage([FromForm] CreateLossAndDamageWithImageFormDto form)
    {
        var dto = new CreateLossAndDamageDto
        {
            RoomInventoryId = form.RoomInventoryId,
            Quantity = form.Quantity,
            PenaltyAmount = form.PenaltyAmount,
            Description = form.Description,
            ImageUrl = null,
        };

        string? imageUrl = null;

        if (form.File != null)
        {
            var randomPublicId = $"loss-{Guid.NewGuid():N}";
            imageUrl = await _cloudinaryService.UploadImageAsync(form.File, "loss-and-damage", randomPublicId);
            dto.ImageUrl = imageUrl;
        }

        var ok = await _service.CreateAsync(dto);
        if (!ok)
        {
            return BadRequest();
        }

        return Ok(new
        {
            message = "Created loss and damage record successfully.",
            imageUrl,
        });
    }
}