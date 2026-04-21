using HotelManagement.Data;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Repositories.Implementations;

public class PaymentRepository : Repository<Payment>, IPaymentRepository
{
    public PaymentRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Payment?> GetByMomoOrderIdAsync(string momoOrderId)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.MomoOrderId == momoOrderId);
    }

    public async Task<Payment?> GetByTransactionCodeAsync(string transactionCode)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.TransactionCode == transactionCode);
    }

    public async Task<decimal> GetCompletedPaidAmountByInvoiceIdAsync(int invoiceId)
    {
        return await _dbSet
            .Where(x => x.InvoiceId == invoiceId)
            .Where(x => x.Status == null || x.Status == "Completed")
            .SumAsync(x => (decimal?)x.AmountPaid) ?? 0m;
    }

    public async Task<bool> HasCompletedBookingPaymentAsync(int bookingId)
    {
        return await _dbSet.AnyAsync(x =>
            x.BookingId == bookingId
            && x.PaymentForType == "booking"
            && (x.Status == null || x.Status == "Completed"));
    }

    public async Task<bool> HasCompletedInvoicePaymentAsync(int invoiceId)
    {
        return await _dbSet.AnyAsync(x =>
            x.InvoiceId == invoiceId
            && x.PaymentForType == "invoice"
            && (x.Status == null || x.Status == "Completed"));
    }
}
