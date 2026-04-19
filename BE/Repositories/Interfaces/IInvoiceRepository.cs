using HotelManagement.Dtos;
using HotelManagement.Entities;

namespace HotelManagement.Repositories.Interfaces;

public interface IInvoiceRepository : IRepository<Invoice>
{
    Task<Invoice?> GetByBookingIdAsync(int bookingId);
    Task<Invoice?> GetByBookingDetailIdAsync(int bookingDetailId);
    Task<PaginatedResultDto<Invoice>> GetPagedInvoicesAsync(InvoiceQueryDto query);
}
