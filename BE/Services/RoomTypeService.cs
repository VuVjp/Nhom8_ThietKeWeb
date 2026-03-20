using HotelManagement.Dtos.RoomType;
using HotelManagement.Entities;
using Microsoft.AspNetCore.Http;
using System.Transactions;

public class RoomTypeService : IRoomTypeService
{
    private readonly IRoomTypeRepository _roomTypeRepository;
    private readonly IRoomImageRepository _roomImageRepository;

    public RoomTypeService(
        IRoomTypeRepository roomTypeRepository,
        IRoomImageRepository roomImageRepository)
    {
        _roomTypeRepository = roomTypeRepository;
        _roomImageRepository = roomImageRepository;
    }

    public async Task<IEnumerable<RoomTypeDto>> GetAllRoomTypesAsync()
    {
        var roomTypes = await _roomTypeRepository.GetAllAsync();
        var dtos = new List<RoomTypeDto>();

        foreach (var rt in roomTypes)
        {
            var images = await _roomImageRepository.GetImagesByRoomTypeIdAsync(rt.Id);
            
            dtos.Add(new RoomTypeDto
            {
                Id = rt.Id,
                Name = rt.Name,
                BasePrice = rt.BasePrice,
                CapacityAdults = rt.CapacityAdults,
                CapacityChildren = rt.CapacityChildren,
                Description = rt.Description,
                IsActive = rt.IsActive,
                RoomImages = images.Select(i => new RoomImageDto
                {
                    Id = i.Id,
                    RoomTypeId = i.RoomTypeId,
                    ImageUrl = i.ImageUrl,
                    IsPrimary = i.IsPrimary
                }).ToList()
            });
        }

        return dtos;
    }

    public async Task<bool> DeleteRoomTypeAsync(int id)
    {
        var roomType = await _roomTypeRepository.GetRoomTypeWithImagesAsync(id);
        if (roomType == null) return false;

        _roomTypeRepository.Delete(roomType);
        await _roomTypeRepository.SaveChangesAsync();
        return true;
    }

    public async Task<RoomImageDto> AddImageAsync(int id, string imageUrl)
    {
        var roomType = await _roomTypeRepository.GetByIdAsync(id);
        if (roomType == null)
            throw new Exception("Room type not found");

        // Check if it's the first image, make it primary automatically
        var existingImages = await _roomImageRepository.GetImagesByRoomTypeIdAsync(id);
        bool isPrimary = !existingImages.Any();

        var roomImage = new RoomImage
        {
            RoomTypeId = id,
            ImageUrl = imageUrl,
            IsPrimary = isPrimary
        };

        await _roomImageRepository.AddAsync(roomImage);
        await _roomImageRepository.SaveChangesAsync();

        return new RoomImageDto
        {
            Id = roomImage.Id,
            RoomTypeId = roomImage.RoomTypeId,
            ImageUrl = roomImage.ImageUrl,
            IsPrimary = roomImage.IsPrimary
        };
    }

    public async Task<bool> DeleteImageAsync(int imageId)
    {
        var image = await _roomImageRepository.GetByIdAsync(imageId);
        if (image == null) return false;
        
        _roomImageRepository.Delete(image);
        await _roomImageRepository.SaveChangesAsync();

        return true;
    }

    public async Task<bool> SetPrimaryImageAsync(int roomTypeId, int imageId)
    {
        var images = await _roomImageRepository.GetImagesByRoomTypeIdAsync(roomTypeId);
        
        var targetImage = images.FirstOrDefault(i => i.Id == imageId);
        if (targetImage == null) return false;

        foreach (var image in images)
        {
            image.IsPrimary = false;
            _roomImageRepository.Update(image);
        }

        targetImage.IsPrimary = true;
        _roomImageRepository.Update(targetImage);

        await _roomImageRepository.SaveChangesAsync();
        return true;
    }
}
