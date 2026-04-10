using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore.Storage;

namespace HotelManagement.Repositories.Interfaces;

public interface IOrderServiceRepository : IRepository<OrderService>
{
    Task<IEnumerable<OrderService>> GetAllWithDetailsAsync();
    Task<OrderService?> GetByIdWithDetailsAsync(int id);
    Task<OrderService?> GetByIdWithBookingAsync(int id);
    Task<OrderServiceDetail?> GetDetailByServiceIdAsync(int orderServiceId, int serviceId);
    void RemoveDetail(OrderServiceDetail detail);
    Task<IDbContextTransaction> BeginTransactionAsync();
    IQueryable<OrderService> GetQueryable();
}
