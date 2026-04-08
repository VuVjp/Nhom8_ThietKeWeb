public interface IInvoiceService
{
    Task<IEnumerable<InvoiceDto>> GetAllAsync();
    Task<InvoiceDto?> GetByIdAsync(int id);
    Task<InvoiceDto> CreateAsync(CreateInvoiceDto dto);
    Task<bool> UpdateStatusAsync(int id, string status);
}