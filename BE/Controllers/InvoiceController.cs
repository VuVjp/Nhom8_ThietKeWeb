using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;
using Microsoft.Data.SqlClient; // Hoặc MySql.Data.MySqlClient tùy DB bạn dùng

[Route("api/[controller]")]
[ApiController]
public class InvoiceController : ControllerBase
{
    private readonly MyDbContext _context; // Giả định bạn dùng Entity Framework

    public InvoiceController(MyDbContext context)
    {
        _context = context;
    }

    // 1. Tạo hóa đơn mới cho một Booking
    [HttpPost("create")]
    public async Task<IActionResult> CreateInvoice([FromBody] InvoiceRequest req)
    {
        var sql = "INSERT INTO invoices (invoice_code, booking_id, customer_id) VALUES ({0}, {1}, {2}); SELECT LAST_INSERT_ID();";
        var invoiceId = await _context.Database.ExecuteSqlRawAsync(sql, req.InvoiceCode, req.BookingId, req.CustomerId);
        
        return Ok(new { InvoiceId = invoiceId, Message = "Đã khởi tạo hóa đơn" });
    }

    // 2. Thêm món/dịch vụ (Trigger SQL sẽ tự tính cột Amount)
    [HttpPost("add-item")]
    public async Task<IActionResult> AddItem([FromBody] ItemRequest req)
    {
        var sql = @"INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price) 
                    VALUES ({0}, {1}, {2}, {3}, {4})";
        
        await _context.Database.ExecuteSqlRawAsync(sql, req.InvoiceId, req.Type, req.Description, req.Quantity, req.UnitPrice);
        return Ok(new { Message = "Đã thêm dịch vụ vào hóa đơn" });
    }

    // 3. Chốt hóa đơn (Gọi Stored Procedure sp_FinalizeInvoice để tính Thuế/Phí)
    [HttpPost("{id}/finalize")]
    public async Task<IActionResult> FinalizeInvoice(int id)
    {
        // Gọi Procedure trong SQL bạn đã viết
        await _context.Database.ExecuteSqlRawAsync("CALL sp_FinalizeInvoice({0})", id);
        
        var invoice = await _context.Invoices.FindAsync(id);
        return Ok(new { Message = "Hóa đơn đã được chốt tổng tiền", Data = invoice });
    }

    // 4. Thanh toán hóa đơn
    [HttpPost("{id}/pay")]
    public async Task<IActionResult> PayInvoice(int id, [FromBody] int bookingId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try {
            // Cập nhật hóa đơn
            await _context.Database.ExecuteSqlRawAsync(
                "UPDATE invoices SET payment_status = 'paid', paid_at = NOW() WHERE id = {0}", id);
            
            // Cập nhật Booking sang trạng thái đã trả phòng
            await _context.Database.ExecuteSqlRawAsync(
                "UPDATE bookings SET status = 'checked_out' WHERE id = {0}", bookingId);

            await transaction.CommitAsync();
            return Ok(new { Message = "Thanh toán thành công và đã hoàn tất Check-out" });
        }
        catch (Exception ex) {
            await transaction.RollbackAsync();
            return BadRequest(ex.Message);
        }
    }
}