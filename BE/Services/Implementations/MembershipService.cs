using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HotelManagement.Services.Implementations;

public class MembershipService : IMembershipService
{
    private readonly IMembershipRepository _repository;

    public MembershipService(IMembershipRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<MembershipDto>> GetAllAsync()
    {
        var entities = await _repository.GetAllAsync();
        return entities.Select(e => new MembershipDto
        {
            Id = e.Id,
            TierName = e.TierName,
            MinPoints = e.MinPoints,
            DiscountPercent = e.DiscountPercent
        });
    }

    public async Task<MembershipDto?> GetByIdAsync(int id)
    {
        var e = await _repository.GetByIdAsync(id);
        if (e == null) return null;
        
        return new MembershipDto
        {
            Id = e.Id,
            TierName = e.TierName,
            MinPoints = e.MinPoints,
            DiscountPercent = e.DiscountPercent
        };
    }

    public async Task<bool> CreateAsync(UpdateMembershipDto dto)
    {
        var entity = new Membership
        {
            TierName = dto.TierName,
            MinPoints = dto.MinPoints,
            DiscountPercent = dto.DiscountPercent
        };
        await _repository.AddAsync(entity);
        return true;
    }

    public async Task<bool> UpdateAsync(int id, UpdateMembershipDto dto)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) return false;

        entity.TierName = dto.TierName;
        entity.MinPoints = dto.MinPoints;
        entity.DiscountPercent = dto.DiscountPercent;

        await _repository.UpdateAsync(entity);
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) return false;

        await _repository.DeleteAsync(entity);
        return true;
    }
}
