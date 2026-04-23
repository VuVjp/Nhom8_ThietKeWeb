using HotelManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using HotelManagement.Services.Interfaces;
using HotelManagement.Dtos;

namespace HotelManagement.Services;

public class AttractionService : IAttractionService
{
	private readonly IAttractionRepository _repository;
	private readonly ICloudinaryService _cloudinaryService;

	public AttractionService(IAttractionRepository repository, ICloudinaryService cloudinaryService)
	{
		_repository = repository;
		_cloudinaryService = cloudinaryService;
	}

	public async Task<IEnumerable<AttractionDto>> GetAllAsync()
	{
		var attractions = await _repository.GetAllActiveAsync();
		return attractions.Select(a => new AttractionDto
		{
			Id = a.Id,
			Name = a.Name,
			Description = a.Description,
			DistanceKm = a.DistanceKm,
			Latitude = a.Latitude,
			Longitude = a.Longitude,
			ImageUrl = a.ImageUrl,
			IsActive = a.IsActive,
			MapEmbedLink = a.MapEmbedLink
		});
	}
		

	public async Task<AttractionDto?> GetByIdAsync(int id)
	{
		var a = await _repository.GetByIdAsync(id);
		if (a == null) return null;

		return new AttractionDto
		{
			Id = a.Id,
			Name = a.Name,
			Description = a.Description,
			DistanceKm = a.DistanceKm,
			Latitude = a.Latitude,
			Longitude = a.Longitude,
			ImageUrl = a.ImageUrl,
			IsActive = a.IsActive,
			MapEmbedLink = a.MapEmbedLink
		};
	}

	public async Task<bool> CreateAsync(CreateAttractionDto dto)
	{
		var entity = new Attraction
		{
			Name = dto.Name,
			Description = dto.Description,
			DistanceKm = dto.DistanceKm,
			Latitude = dto.Latitude,
			Longitude = dto.Longitude,
			IsActive = dto.IsActive,
			MapEmbedLink = dto.MapEmbedLink
		};

		if (dto.File != null)
		{
			entity.ImageUrl = await _cloudinaryService.UploadImageAsync(dto.File, $"attractions");
		}

		await _repository.AddAsync(entity);
		await _repository.SaveChangesAsync();

		return true;
	}
		

	public async Task<bool> UpdateAsync(int id, UpdateAttractionDto dto)
	{
		var attraction = await _repository.GetByIdAsync(id);
		if (attraction == null || !attraction.IsActive) return false;

		attraction.Name = dto.Name;
		attraction.Description = dto.Description;
		attraction.DistanceKm = dto.DistanceKm;
		attraction.Latitude = dto.Latitude;
		attraction.Longitude = dto.Longitude;
		if (dto.IsActive.HasValue) attraction.IsActive = dto.IsActive.Value;
		attraction.MapEmbedLink = dto.MapEmbedLink;

		if (dto.File != null)
		{
			attraction.ImageUrl = await _cloudinaryService.UploadImageAsync(dto.File, $"attractions");
		}

		_repository.Update(attraction);
		await _repository.SaveChangesAsync();
		return true;
	}

	public async Task<bool> DeleteAsync(int id)
	{
		var attraction = await _repository.GetByIdAsync(id);
		if (attraction == null || !attraction.IsActive) return false;

		attraction.IsActive = false;
		_repository.Update(attraction);
		await _repository.SaveChangesAsync();
		return true;
	}
}