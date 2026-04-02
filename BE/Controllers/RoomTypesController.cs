using HotelManagement.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomTypesController : ControllerBase
    {
        private readonly IRoomTypeService _roomTypeService;

        public RoomTypesController(IRoomTypeService roomTypeService)
        {
            _roomTypeService = roomTypeService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoomTypeDto>>> GetRoomTypes()
        {
            var roomTypes = await _roomTypeService.GetAllRoomTypesAsync();
            return Ok(roomTypes);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RoomTypeDto>> GetRoomType(int id)
        {
            var roomType = await _roomTypeService.GetRoomTypeByIdAsync(id);
            if (roomType == null)
                return NotFound(new { message = "Room type not found." });

            return Ok(roomType);
        }

        [Permission(PermissionNames.ManageRoomType)]
        [HttpPost]
        public async Task<ActionResult<RoomTypeDto>> CreateRoomType(CreateRoomTypeDto dto)
        {
            var result = await _roomTypeService.CreateRoomTypeAsync(dto);
            if (!result)
                return BadRequest(new { message = "Failed to create room type." });

            return Ok(new { message = "Room type created successfully." });
        }

        [Permission(PermissionNames.ManageRoomType)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoomType(int id, UpdateRoomTypeDto dto)
        {
            var result = await _roomTypeService.UpdateRoomTypeAsync(id, dto);
            if (!result)
                return NotFound(new { message = "Room type not found." });

            return NoContent();
        }

        [Permission(PermissionNames.ManageRoomType)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoomType(int id)
        {
            var result = await _roomTypeService.DeleteRoomTypeAsync(id);
            if (!result)
                return NotFound(new { message = "Room type not found." });

            return NoContent();
        }

        [Permission(PermissionNames.ManageRoomType)]
        [HttpPost("{id}/images")]
        public async Task<ActionResult<RoomImageDto>> AddImage(int id, [FromForm] AddRoomImageDto dto)
        {
            var result = await _roomTypeService.AddImageAsync(id, dto);
            if (!result)
                return NotFound(new { message = "Room type not found." });

            return Ok(new { message = "Image added successfully." });
        }

        [Permission(PermissionNames.ManageRoomType)]
        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            var result = await _roomTypeService.DeleteImageAsync(imageId);

            if (!result)
                return NotFound(new { message = "Image not found." });

            return NoContent();
        }

        [Permission(PermissionNames.ManageRoomType)]
        [HttpPatch("{roomTypeId}/images/{imageId}/set-primary")]
        public async Task<IActionResult> SetPrimaryImage(int roomTypeId, int imageId)
        {
            var result = await _roomTypeService.SetPrimaryImageAsync(roomTypeId, imageId);

            if (!result)
                return NotFound(new { message = "Image or RoomType not found." });

            return NoContent();
        }
    }
}