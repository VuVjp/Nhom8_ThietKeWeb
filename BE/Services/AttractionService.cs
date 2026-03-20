using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace HotelManagement.Services.Implementations;

public class AttractionService : IAttractionService
{
	private readonly IAttractionRepository _repository;

	public AttractionService(IAttractionRepository repository)
	{
		_repository = repository;
	}

	public async Task<IEnumerable<Attraction>> GetAttractionsAsync()
	{
		return await _repository.GetAllAsync();
	}

	public async Task<Attraction?> GetAttractionByIdAsync(int id)
	{
		return await _repository.GetByIdAsync(id);
	}

	public async Task<bool> CreateAttractionAsync(Attraction attraction)
	{
		if (string.IsNullOrWhiteSpace(attraction.Name))
			throw new ArgumentException("Tên địa điểm không được để trống.");

		if (attraction.DistanceKm < 0)
			throw new ArgumentException("Khoảng cách không thể là số âm.");

		await _repository.AddAsync(attraction);
		return await _repository.SaveChangesAsync();
	}

	public async Task<bool> UpdateAttractionAsync(int id, Attraction attraction)
	{
		var existing = await _repository.GetByIdAsync(id);
		if (existing == null) return false;
		existing.Name = attraction.Name;
		existing.DistanceKm = attraction.DistanceKm;
		existing.Description = attraction.Description;
		existing.MapEmbedLink = attraction.MapEmbedLink;

		_repository.Update(existing);
		return await _repository.SaveChangesAsync();
	}

	public async Task<bool> DeleteAttractionAsync(int id)
	{
		var attraction = await _repository.GetByIdAsync(id);
		if (attraction == null) return false;

		_repository.Delete(attraction);
		return await _repository.SaveChangesAsync();
	}
}