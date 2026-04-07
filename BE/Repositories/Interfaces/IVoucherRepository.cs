using HotelManagement.Entities;

namespace HotelManagement.Repositories.Interfaces;

public interface IVoucherRepository : IRepository<Voucher>
{
    Task<Voucher?> GetByCodeAsync(string code);
    Task<IEnumerable<Voucher>> GetAllActiveAsync();
}