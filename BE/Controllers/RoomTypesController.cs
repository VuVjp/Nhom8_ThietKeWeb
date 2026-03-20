using HotelManagement.Dtos.RoomType;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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

        // GET: /api/RoomTypes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoomTypeDto>>> GetRoomTypes()
        {
            var roomTypes = await _roomTypeService.GetAllRoomTypesAsync();
            return Ok(roomTypes);
        }

        // DELETE: /api/RoomTypes/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoomType(int id)
        {
            var result = await _roomTypeService.DeleteRoomTypeAsync(id);
            if (!result) return NotFound(new { message = "Room type not found." });

            return NoContent();
        }

        // POST: /api/RoomTypes/{id}/images
        [HttpPost("{id}/images")]
        public async Task<ActionResult<RoomImageDto>> AddImage(int id, [FromBody] AddRoomImageDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.ImageUrl))
                    return BadRequest(new { message = "ImageUrl is required." });

                var imageDto = await _roomTypeService.AddImageAsync(id, dto.ImageUrl);
                return Created($"/api/RoomTypes/{id}/images/{imageDto.Id}", imageDto);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: /api/RoomTypes/images/{imageId}
        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            var result = await _roomTypeService.DeleteImageAsync(imageId);
            if (!result) return NotFound(new { message = "Image not found." });

            return NoContent();
        }

        // PATCH: /api/RoomTypes/{roomTypeId}/images/{imageId}/set-primary
        [HttpPatch("{roomTypeId}/images/{imageId}/set-primary")]
        public async Task<IActionResult> SetPrimaryImage(int roomTypeId, int imageId)
        {
            var result = await _roomTypeService.SetPrimaryImageAsync(roomTypeId, imageId);
            if (!result) return NotFound(new { message = "Image or Room Type not found." });

            return NoContent();
        }
    }
}
