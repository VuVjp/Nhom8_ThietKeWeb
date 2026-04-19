using HotelManagement.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomTypesController : ControllerBase
    {
        private readonly IRoomTypeService _roomTypeService;
        private readonly INotificationService _notificationService;

        public RoomTypesController(IRoomTypeService roomTypeService, INotificationService notificationService)
        {
            _roomTypeService = roomTypeService;
            _notificationService = notificationService;
        }

        private async Task NotifyRolesAsync(IEnumerable<RoleName> roles, CreateNotificationDto dto)
        {
            var tasks = roles.Distinct().Select(role => _notificationService.SendByRoleAsync(role, dto));
            await Task.WhenAll(tasks);
        }

        private async Task TryNotifyRolesAsync(IEnumerable<RoleName> roles, CreateNotificationDto dto)
        {
            try
            {
                await NotifyRolesAsync(roles, dto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification Warning] {ex.Message}");
            }
        }

        private static IEnumerable<RoleName> GetRoomTypeRoles()
        {
            return new[] { RoleName.Admin, RoleName.Manager };
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

            await TryNotifyRolesAsync(
                GetRoomTypeRoles(),
                new CreateNotificationDto
                {
                    Title = "Room type created",
                    Content = $"Room type {dto.Name} was created.",
                    Type = NotificationAction.RoomTypeCreated,
                    ReferenceLink = "admin/room-types"
                });

            return Ok(new { message = "Room type created successfully." });
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoomType(int id, [FromForm] UpdateRoomTypeDto dto)
        {
            var result = await _roomTypeService.UpdateRoomTypeAsync(id, dto);
            if (!result)
                return NotFound(new { message = "Room type not found." });

            await TryNotifyRolesAsync(
                GetRoomTypeRoles(),
                new CreateNotificationDto
                {
                    Title = "Room type updated",
                    Content = $"Room type #{id} was updated.",
                    Type = NotificationAction.RoomTypeUpdated,
                    ReferenceLink = $"admin/room-types/{id}"
                });

            return NoContent();
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpPatch("{id}/set-primary-image/")]
        public async Task<IActionResult> SetPrimaryImage(int id, [FromQuery] int imageId)
        {
            var result = await _roomTypeService.SetPrimaryRoomImageAsync(id, imageId);
            if (!result)
                return NotFound(new { message = "Room type or image not found." });

            await TryNotifyRolesAsync(
                GetRoomTypeRoles(),
                new CreateNotificationDto
                {
                    Title = "Room type primary image changed",
                    Content = $"Room type #{id} primary image was updated.",
                    Type = NotificationAction.RoomTypePrimaryImageChanged,
                    ReferenceLink = $"admin/room-types/{id}"
                });

            return NoContent();
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpPatch("{id}/toggle-active")]
        public async Task<IActionResult> ToggleRoomTypeActive(int id)
        {
            var result = await _roomTypeService.ToggleActiveAsync(id);
            if (!result)
                return NotFound(new { message = "Room type not found." });

            await TryNotifyRolesAsync(
                GetRoomTypeRoles(),
                new CreateNotificationDto
                {
                    Title = "Room type active status changed",
                    Content = $"Room type #{id} active status was toggled.",
                    Type = NotificationAction.RoomTypeActivated,
                    ReferenceLink = $"admin/room-types/{id}"
                });

            return Ok(new { message = "Room type active status toggled successfully." });
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpPost("{id}/images")]
        public async Task<ActionResult<RoomImageDto>> AddImage(int id, [FromForm] AddRoomImageDto dto)
        {
            var result = await _roomTypeService.AddImageAsync(id, dto);
            if (!result)
                return NotFound(new { message = "Room type not found." });

            await TryNotifyRolesAsync(
                GetRoomTypeRoles(),
                new CreateNotificationDto
                {
                    Title = "Room type image added",
                    Content = $"An image was added to room type #{id}.",
                    Type = NotificationAction.RoomTypeImageAdded,
                    ReferenceLink = $"admin/room-types/{id}"
                });

            return Ok(new { message = "Image added successfully." });
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            var result = await _roomTypeService.DeleteImageAsync(imageId);

            if (!result)
                return NotFound(new { message = "Image not found." });

            await TryNotifyRolesAsync(
                GetRoomTypeRoles(),
                new CreateNotificationDto
                {
                    Title = "Room type image deleted",
                    Content = $"Image #{imageId} was deleted from a room type.",
                    Type = NotificationAction.RoomTypeImageDeleted,
                    ReferenceLink = "admin/room-types"
                });

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

            await TryNotifyRolesAsync(
                GetRoomTypeRoles(),
                new CreateNotificationDto
                {
                    Title = "Room type amenity added",
                    Content = $"Amenity #{dto.AmenityId} was added to room type #{id}.",
                    Type = NotificationAction.RoomTypeAmenityAdded,
                    ReferenceLink = $"admin/room-types/{id}"
                });

            return Ok(new { message = "Amenity added successfully." });
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpPost("{id}/amenities/bulk")]
        public async Task<IActionResult> AddAmenities(int id, [FromBody] AddRoomTypeAmenitiesDto dto)
        {
            var result = await _roomTypeService.AddAmenitiesAsync(id, dto);
            if (!result)
                return NotFound(new { message = "Room type or amenities not found." });

            await TryNotifyRolesAsync(
                GetRoomTypeRoles(),
                new CreateNotificationDto
                {
                    Title = "Room type amenities added",
                    Content = $"{dto.AmenityIds.Count} amenity(ies) were added to room type #{id}.",
                    Type = NotificationAction.RoomTypeAmenitiesAdded,
                    ReferenceLink = $"admin/room-types/{id}"
                });

            return Ok(new { message = "Amenities added successfully." });
        }

        [Permission(PermissionNames.ManageRoomTypes)]
        [HttpDelete("{id}/amenities/{amenityId}")]
        public async Task<IActionResult> RemoveAmenity(int id, int amenityId)
        {
            var result = await _roomTypeService.RemoveAmenityAsync(id, amenityId);
            if (!result)
                return NotFound(new { message = "Room type amenity relation not found." });

            await TryNotifyRolesAsync(
                GetRoomTypeRoles(),
                new CreateNotificationDto
                {
                    Title = "Room type amenity removed",
                    Content = $"Amenity #{amenityId} was removed from room type #{id}.",
                    Type = NotificationAction.RoomTypeAmenityRemoved,
                    ReferenceLink = $"admin/room-types/{id}"
                });

            return NoContent();
        }
    }
}