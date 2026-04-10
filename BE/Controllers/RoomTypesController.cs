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

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpPost]
        public async Task<ActionResult<RoomTypeDto>> CreateRoomType([FromForm] CreateRoomTypeDto dto)
        {
            var result = await _roomTypeService.CreateRoomTypeAsync(dto);
            if (!result)
                return BadRequest(new { message = "Failed to create room type." });

            return Ok(new { message = "Room type created successfully." });
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoomType(int id, [FromForm] UpdateRoomTypeDto dto)
        {
            var result = await _roomTypeService.UpdateRoomTypeAsync(id, dto);
            if (!result)
                return NotFound(new { message = "Room type not found." });

            return NoContent();
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpPatch("{id}/set-primary-image/")]
        public async Task<IActionResult> SetPrimaryImage(int id, [FromQuery] int imageId)
        {
            var result = await _roomTypeService.SetPrimaryRoomImageAsync(id, imageId);
            if (!result)
                return NotFound(new { message = "Room type or image not found." });

            return NoContent();
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpPatch("{id}/toggle-active")]
        public async Task<IActionResult> ToggleRoomTypeActive(int id)
        {
            var result = await _roomTypeService.ToggleActiveAsync(id);
            if (!result)
                return NotFound(new { message = "Room type not found." });

            return Ok(new { message = "Room type active status toggled successfully." });
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpPost("{id}/images")]
        public async Task<ActionResult<RoomImageDto>> AddImage(int id, [FromForm] AddRoomImageDto dto)
        {
            var result = await _roomTypeService.AddImageAsync(id, dto);
            if (!result)
                return NotFound(new { message = "Room type not found." });

            return Ok(new { message = "Image added successfully." });
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            var result = await _roomTypeService.DeleteImageAsync(imageId);

            if (!result)
                return NotFound(new { message = "Image not found." });

            return NoContent();
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpGet("{id}/amenities")]
        public async Task<IActionResult> GetAmenities(int id)
        {
            var amenities = await _roomTypeService.GetAmenitiesAsync(id);
            return Ok(amenities);
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpPost("{id}/amenities")]
        public async Task<IActionResult> AddAmenity(int id, [FromBody] AddRoomTypeAmenityDto dto)
        {
            var result = await _roomTypeService.AddAmenityAsync(id, dto);
            if (!result)
                return NotFound(new { message = "Room type not found." });

            return Ok(new { message = "Amenity added successfully." });
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpPost("{id}/amenities/bulk")]
        public async Task<IActionResult> AddAmenities(int id, [FromBody] AddRoomTypeAmenitiesDto dto)
        {
            var result = await _roomTypeService.AddAmenitiesAsync(id, dto);
            if (!result)
                return NotFound(new { message = "Room type or amenities not found." });

            return Ok(new { message = "Amenities added successfully." });
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpDelete("{id}/amenities/{amenityId}")]
        public async Task<IActionResult> RemoveAmenity(int id, int amenityId)
        {
            var result = await _roomTypeService.RemoveAmenityAsync(id, amenityId);
            if (!result)
                return NotFound(new { message = "Room type amenity relation not found." });

            return NoContent();
        }
    }
}