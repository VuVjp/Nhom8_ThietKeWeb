using HotelManagement.Dtos;

namespace HotelManagement.Services.Interfaces;

public interface IOrderServiceService
{
    Task<PaginatedResultDto<OrderServiceSummaryDto>> GetPagedAsync(OrderServiceQueryDto query);
    Task<OrderServiceDto?> GetByIdAsync(int id);
    Task<int> CreateAsync(CreateOrderServiceDto dto);
    Task<bool> AddItemAsync(int id, AddItemToOrderDto dto);
    Task<bool> UpdateItemAsync(int id, int serviceId, UpdateOrderItemDto dto);
    Task<bool> RemoveItemAsync(int id, int serviceId);
    Task<bool> ChangeStatusAsync(int id, string status);
}
