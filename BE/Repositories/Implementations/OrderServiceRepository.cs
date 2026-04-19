using HotelManagement.Data;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace HotelManagement.Repositories.Implementations;

public class OrderServiceRepository : Repository<OrderService>, IOrderServiceRepository
{
    public OrderServiceRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<OrderService>> GetAllWithDetailsAsync()
    {
        return await _dbSet
            .Include(os => os.BookingDetail)
                .ThenInclude(bd => bd!.Room)
            .OrderByDescending(os => os.CreatedAt)
            .ToListAsync();
    }

    public async Task<OrderService?> GetByIdWithDetailsAsync(int id)
    {
        return await _context.OrderServices
    .Include(os => os.BookingDetail)
        .ThenInclude(bd => bd.Room)
    .Include(os => os.BookingDetail)
        .ThenInclude(bd => bd.Booking)
    .Include(os => os.OrderServiceDetails)
    .FirstOrDefaultAsync(os => os.Id == id);
    }

    public async Task<OrderService?> GetByIdWithBookingAsync(int id)
    {
        return await _dbSet
            .Include(os => os.BookingDetail)
                .ThenInclude(bd => bd!.Booking)
            .FirstOrDefaultAsync(os => os.Id == id);
    }

    public async Task<OrderServiceDetail?> GetDetailByServiceIdAsync(int orderServiceId, int serviceId)
    {
        return await _context.OrderServiceDetails
            .FirstOrDefaultAsync(osd => osd.OrderServiceId == orderServiceId && osd.ServiceId == serviceId);
    }

    public void RemoveDetail(OrderServiceDetail detail)
    {
        _context.OrderServiceDetails.Remove(detail);
    }

    public async Task<IDbContextTransaction> BeginTransactionAsync()
    {
        return await _context.Database.BeginTransactionAsync();
    }

    public IQueryable<OrderService> GetQueryable()
    {
        return _dbSet.AsQueryable();
    }
}
