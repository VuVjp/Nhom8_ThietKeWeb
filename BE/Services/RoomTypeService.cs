using HotelManagement.Dtos;
using HotelManagement.Entities;
using Microsoft.AspNetCore.Http;
using System.Transactions;

public class RoomTypeService : IRoomTypeService
{
    private readonly IRoomTypeRepository _roomTypeRepository;
    private readonly IRoomImageRepository _roomImageRepository;
    private readonly IAmenityRepository _amenityRepository;
    private readonly ICloudinaryService _cloudinaryService;

    public RoomTypeService(
        IRoomTypeRepository roomTypeRepository,
        IRoomImageRepository roomImageRepository,
        IAmenityRepository amenityRepository,
        ICloudinaryService cloudinaryService)
    {
        _roomTypeRepository = roomTypeRepository;
        _roomImageRepository = roomImageRepository;
        _amenityRepository = amenityRepository;
        _cloudinaryService = cloudinaryService;
    }

    public async Task<IEnumerable<RoomTypeDto>> GetAllRoomTypesAsync()
    {
        var roomTypes = await _roomTypeRepository.GetAllActiveWithImagesAndAmenitiesAsync();
        return roomTypes.Select(ToDto);
    }
    public async Task<RoomTypeDto?> GetRoomTypeByIdAsync(int id)
    {
        var roomType = await _roomTypeRepository.GetByIdWithImagesAndAmenitiesAsync(id);
        if (roomType == null) return null;

        return ToDto(roomType);
    }
    public async Task<bool> CreateRoomTypeAsync(CreateRoomTypeDto dto)
    {
        var roomType = new RoomType
        {
            Name = dto.Name,
            BasePrice = dto.BasePrice,
            CapacityAdults = dto.CapacityAdults,
            CapacityChildren = dto.CapacityChildren,
            Description = dto.Description,
            IsActive = true
        };

        await _roomTypeRepository.AddAsync(roomType);
        await _roomTypeRepository.SaveChangesAsync();

        return true;
    }
    public async Task<bool> UpdateRoomTypeAsync(int id, UpdateRoomTypeDto dto)
    {
        var roomType = await _roomTypeRepository.GetByIdAsync(id);
        if (roomType == null) return false;

        roomType.Name = dto.Name;
        roomType.BasePrice = dto.BasePrice;
        roomType.CapacityAdults = dto.CapacityAdults;
        roomType.CapacityChildren = dto.CapacityChildren;
        roomType.Description = dto.Description;

        _roomTypeRepository.Update(roomType);
        await _roomTypeRepository.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteRoomTypeAsync(int id)
    {
        var roomType = await _roomTypeRepository.GetByIdAsync(id);
        if (roomType == null) return false;

        roomType.IsActive = false;

        _roomTypeRepository.Update(roomType);
        await _roomTypeRepository.SaveChangesAsync();

        return true;
    }

    public async Task<bool> AddImageAsync(int id, AddRoomImageDto dto)
    {
        var roomType = await _roomTypeRepository.GetByIdAsync(id);
        if (roomType == null)
            throw new Exception("Room type not found");

        var imageUrl = dto.ImageUrl;
        if (dto.File != null)
        {
            imageUrl = await _cloudinaryService.UploadImageAsync(dto.File, "room-types", roomType.Name);
        }

        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            throw new Exception("Image file or image URL is required.");
        }

        var existingImages = await _roomImageRepository.GetImagesByRoomTypeIdAsync(id);

        var roomImage = new RoomImage
        {
            RoomTypeId = id,
            ImageUrl = imageUrl,
            IsPrimary = !existingImages.Any()
        };

        await _roomImageRepository.AddAsync(roomImage);
        await _roomImageRepository.SaveChangesAsync();

        return true;
    }
    public async Task<bool> DeleteImageAsync(int imageId)
    {
        var image = await _roomImageRepository.GetByIdAsync(imageId);
        if (image == null) return false;

        if (image.RoomTypeId == null) return false;

        if (image.IsPrimary ?? false)
        {
            var images = await _roomImageRepository
                .GetImagesByRoomTypeIdAsync(image.RoomTypeId.Value);

            var next = images.FirstOrDefault(x => x.Id != image.Id);
            if (next != null)
            {
                next.IsPrimary = true;
                _roomImageRepository.Update(next);
            }
        }

        _roomImageRepository.Delete(image);
        await _roomImageRepository.SaveChangesAsync();

        return true;
    }

    public async Task<bool> SetPrimaryImageAsync(int roomTypeId, int imageId)
    {
        var images = (await _roomImageRepository
            .GetImagesByRoomTypeIdAsync(roomTypeId)).ToList();

        var targetImage = images.FirstOrDefault(x => x.Id == imageId);
        if (targetImage == null) return false;

        images.ForEach(img => img.IsPrimary = false);

        targetImage.IsPrimary = true;

        foreach (var img in images)
        {
            _roomImageRepository.Update(img);
        }

        await _roomImageRepository.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<AmenityDto>> GetAmenitiesAsync(int roomTypeId)
    {
        var roomType = await _roomTypeRepository.GetByIdWithImagesAndAmenitiesAsync(roomTypeId);
        if (roomType == null)
        {
            throw new NotFoundException($"Room type with ID {roomTypeId} not found.");
        }

        return roomType.RoomTypeAmenities
            .Where(x => x.Amenity != null && x.Amenity.IsActive)
            .Select(x => new AmenityDto
            {
                Id = x.Amenity.Id,
                Name = x.Amenity.Name,
                IconUrl = x.Amenity.IconUrl
            });
    }

    public async Task<bool> AddAmenityAsync(int roomTypeId, AddRoomTypeAmenityDto dto)
    {
        if (dto.AmenityId <= 0)
        {
            throw new ArgumentException("AmenityId is required.");
        }

        var amenity = await _amenityRepository.GetByIdAsync(dto.AmenityId);
        if (amenity == null || !amenity.IsActive)
        {
            throw new NotFoundException($"Amenity with ID {dto.AmenityId} not found.");
        }

        var result = await _roomTypeRepository.AddAmenityAsync(roomTypeId, dto.AmenityId);
        if (!result)
        {
            throw new NotFoundException($"Room type with ID {roomTypeId} not found.");
        }

        return true;
    }

    public async Task<bool> AddAmenitiesAsync(int roomTypeId, AddRoomTypeAmenitiesDto dto)
    {
        if (dto.AmenityIds == null || dto.AmenityIds.Count == 0)
        {
            throw new ArgumentException("AmenityIds is required.");
        }

        var result = await _roomTypeRepository.AddAmenitiesAsync(roomTypeId, dto.AmenityIds);
        if (!result)
        {
            throw new NotFoundException("Room type or one of the amenities was not found.");
        }

        return true;
    }

    public async Task<bool> RemoveAmenityAsync(int roomTypeId, int amenityId)
    {
        var result = await _roomTypeRepository.RemoveAmenityAsync(roomTypeId, amenityId);
        if (!result)
        {
            throw new NotFoundException("Room type amenity relation not found.");
        }

        return true;
    }

    private static RoomTypeDto ToDto(RoomType roomType)
    {
        return new RoomTypeDto
        {
            Id = roomType.Id,
            Name = roomType.Name,
            BasePrice = roomType.BasePrice,
            CapacityAdults = roomType.CapacityAdults,
            CapacityChildren = roomType.CapacityChildren,
            Description = roomType.Description,
            Amenities = roomType.RoomTypeAmenities
                .Where(x => x.Amenity != null && x.Amenity.IsActive)
                .Select(x => new AmenityDto
                {
                    Id = x.Amenity.Id,
                    Name = x.Amenity.Name,
                    IconUrl = x.Amenity.IconUrl
                })
                .ToList(),
            RoomImages = roomType.RoomImages.Select(i => new RoomImageDto
            {
                Id = i.Id,
                ImageUrl = i.ImageUrl,
                IsPrimary = i.IsPrimary ?? false
            }).ToList()
        };
    }
}
