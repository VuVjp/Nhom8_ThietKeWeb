using HotelManagement.Data;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

public class VoucherRepository : Repository<Voucher>, IVoucherRepository
{
    public VoucherRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Voucher?> GetByCodeAsync(string code)
    {
        var normalized = code.Trim().ToUpperInvariant();
        return await _dbSet.FirstOrDefaultAsync(item => item.Code.ToUpper() == normalized);
    }

    public async Task<IEnumerable<Voucher>> GetAllActiveAsync()
    {
        return await _dbSet
            .Where(item => item.IsActive)
            .OrderByDescending(item => item.Id)
            .ToListAsync();
    }
}