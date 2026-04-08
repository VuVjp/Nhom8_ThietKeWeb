using HotelManagement.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelManagement.Services.Interfaces;

public interface IMembershipService
{
    Task<IEnumerable<MembershipDto>> GetAllAsync();
    Task<MembershipDto?> GetByIdAsync(int id);
    Task<bool> CreateAsync(UpdateMembershipDto dto);
    Task<bool> UpdateAsync(int id, UpdateMembershipDto dto);
    Task<bool> DeleteAsync(int id);
}
