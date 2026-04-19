using HotelManagement.Dtos;
using HotelManagement.Entities;

namespace HotelManagement.Services.Interfaces;

public interface IInvoiceService
{
    Task<Invoice> CreateInvoiceAsync(int bookingId);
    Task<Invoice?> GetInvoiceByBookingIdAsync(int bookingId);
    Task<Invoice?> GetInvoiceByIdAsync(int id);
    Task<IEnumerable<Invoice>> GetAllInvoicesAsync();
    Task<PaginatedResultDto<Invoice>> GetPagedInvoicesAsync(InvoiceQueryDto query);
    Task<bool> CompleteInvoiceAsync(int bookingId);
    Task<bool> CompleteInvoiceByIdAsync(int id);
    Task UpdateInvoiceAmountsAsync(int bookingId);
    Task<bool> SplitInvoiceAsync(int invoiceId);
    Task<bool> SplitMultipleAsync(int invoiceId, List<int> roomDetailIds);
}
