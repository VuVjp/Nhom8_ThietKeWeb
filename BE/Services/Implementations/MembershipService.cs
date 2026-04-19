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
        var memberships = await _repository.GetAllAsync();
        return memberships.Select(m => new MembershipDto
        {
            Id = m.Id,
            TierName = m.TierName,
            MinPoints = m.MinPoints,
            DiscountPercent = m.DiscountPercent,
            IsActive = m.IsActive
        });
    }

    public async Task<MembershipDto?> GetByIdAsync(int id)
    {
        var m = await _repository.GetByIdAsync(id);
        if (m == null) return null;

        return new MembershipDto
        {
            Id = m.Id,
            TierName = m.TierName,
            MinPoints = m.MinPoints,
            DiscountPercent = m.DiscountPercent,
            IsActive = m.IsActive
        };
    }

    public async Task<bool> CreateAsync(CreateMembershipDto dto)
    {
        var entity = new Membership
        {
            TierName = dto.TierName,
            MinPoints = dto.MinPoints,
            DiscountPercent = dto.DiscountPercent,
            IsActive = dto.IsActive
        };

        await _repository.AddAsync(entity);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateAsync(int id, UpdateMembershipDto dto)
    {
        var membership = await _repository.GetByIdAsync(id);
        if (membership == null) return false;

        membership.TierName = dto.TierName;
        membership.MinPoints = dto.MinPoints;
        membership.DiscountPercent = dto.DiscountPercent;
        membership.IsActive = dto.IsActive;

        _repository.Update(membership);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var membership = await _repository.GetByIdAsync(id);
        if (membership == null) return false;

        _repository.Delete(membership);
        await _repository.SaveChangesAsync();
        return true;
    }
}
