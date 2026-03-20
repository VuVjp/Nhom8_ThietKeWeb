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

        [Permission("('manage_room_type')")]
        [HttpPost]
        public async Task<ActionResult<RoomTypeDto>> CreateRoomType(CreateRoomTypeDto dto)
        {
            var createdRoomType = await _roomTypeService.CreateRoomTypeAsync(dto);
            return CreatedAtAction(nameof(GetRoomType), new { id = createdRoomType.Id }, createdRoomType);
        }

        [Permission("('manage_room_type')")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoomType(int id, UpdateRoomTypeDto dto)
        {
            var result = await _roomTypeService.UpdateRoomTypeAsync(id, dto);
            if (result == null)
                return NotFound(new { message = "Room type not found." });

            return NoContent();
        }

        [Permission("('manage_room_type')")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoomType(int id)
        {
            var result = await _roomTypeService.DeleteRoomTypeAsync(id);
            if (!result)
                return NotFound(new { message = "Room type not found." });

            return NoContent();
        }

        [Permission("('manage_room_type')")]
        [HttpPost("{id}/images")]
        public async Task<ActionResult<RoomImageDto>> AddImage(int id, [FromBody] AddRoomImageDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.ImageUrl))
                return BadRequest(new { message = "ImageUrl is required." });

            try
            {
                var imageDto = await _roomTypeService.AddImageAsync(id, dto);

                return Created(
                    $"/api/RoomTypes/{id}/images/{imageDto.Id}",
                    imageDto
                );
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Permission("('manage_room_type')")]
        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            var result = await _roomTypeService.DeleteImageAsync(imageId);

            if (!result)
                return NotFound(new { message = "Image not found." });

            return NoContent();
        }

        [Permission("('manage_room_type')")]            
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