using HotelManagement.Entities;

public interface IVoucherRepository : IRepository<Voucher>
{
    Task<Voucher?> GetByCodeAsync(string code);
    Task<IEnumerable<Voucher>> GetAllActiveAsync();
}