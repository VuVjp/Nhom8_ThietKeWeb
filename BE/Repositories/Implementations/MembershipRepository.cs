using HotelManagement.Data;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;

namespace HotelManagement.Repositories.Implementations;

public class MembershipRepository : Repository<Membership>, IMembershipRepository
{
    public MembershipRepository(AppDbContext context) : base(context)
    {
    }
}
