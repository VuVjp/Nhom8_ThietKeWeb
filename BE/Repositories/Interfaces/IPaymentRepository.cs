using HotelManagement.Entities;

namespace HotelManagement.Repositories.Interfaces;

public interface IPaymentRepository : IRepository<Payment>
{
    Task<Payment?> GetByMomoOrderIdAsync(string momoOrderId);
    Task<Payment?> GetByTransactionCodeAsync(string transactionCode);
    Task<decimal> GetCompletedPaidAmountByInvoiceIdAsync(int invoiceId);
    Task<bool> HasCompletedBookingPaymentAsync(int bookingId);
    Task<bool> HasCompletedInvoicePaymentAsync(int invoiceId);
}
