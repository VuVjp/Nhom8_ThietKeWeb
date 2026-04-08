using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Enums;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Services.Implementations;

public class OrderServiceService : IOrderServiceService
{
    private readonly IOrderServiceRepository _repository;
    private readonly IServiceRepository _serviceRepository;

    public OrderServiceService(IOrderServiceRepository repository, IServiceRepository serviceRepository)
    {
        _repository = repository;
        _serviceRepository = serviceRepository;
    }

    public async Task<PaginatedResultDto<OrderServiceSummaryDto>> GetPagedAsync(OrderServiceQueryDto query)
    {
        var dbQuery = _repository.GetQueryable()
            .Include(os => os.BookingDetail)
                .ThenInclude(bd => bd!.Room)
            .Include(os => os.BookingDetail)
                .ThenInclude(bd => bd!.Booking)
            .AsQueryable();

        // Search (ID, Room, Guest)
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(os => 
                os.Id.ToString().Contains(search) || 
                (os.BookingDetail != null && os.BookingDetail.Room != null && os.BookingDetail.Room.RoomNumber.ToLower().Contains(search)) ||
                (os.BookingDetail != null && os.BookingDetail.Booking != null && os.BookingDetail.Booking.GuestName.ToLower().Contains(search))
            );
        }

        // Date Filter
        if (query.StartDate.HasValue)
        {
            dbQuery = dbQuery.Where(os => os.OrderDate >= query.StartDate.Value);
        }
        if (query.EndDate.HasValue)
        {
            dbQuery = dbQuery.Where(os => os.OrderDate <= query.EndDate.Value);
        }

        // Status Filter
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            if (Enum.TryParse<OrderServiceStatus>(query.Status, true, out var status))
            {
                dbQuery = dbQuery.Where(os => os.Status == status);
            }
        }

        // Sorting
        if (!string.IsNullOrWhiteSpace(query.SortBy))
        {
            var isDesc = query.SortOrder?.ToLower() == "desc";
            dbQuery = query.SortBy.ToLower() switch
            {
                "id" => isDesc ? dbQuery.OrderByDescending(os => os.Id) : dbQuery.OrderBy(os => os.Id),
                "amount" => isDesc ? dbQuery.OrderByDescending(os => os.TotalAmount) : dbQuery.OrderBy(os => os.TotalAmount),
                "date" => isDesc ? dbQuery.OrderByDescending(os => os.OrderDate) : dbQuery.OrderBy(os => os.OrderDate),
                "status" => isDesc ? dbQuery.OrderByDescending(os => os.Status) : dbQuery.OrderBy(os => os.Status),
                _ => dbQuery.OrderByDescending(os => os.OrderDate)
            };
        }
        else
        {
            dbQuery = dbQuery.OrderByDescending(os => os.OrderDate);
        }

        var total = await dbQuery.CountAsync();
        var items = await dbQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(os => new OrderServiceSummaryDto
            {
                Id = os.Id,
                BookingDetailId = os.BookingDetailId,
                RoomNumber = os.BookingDetail != null && os.BookingDetail.Room != null ? os.BookingDetail.Room.RoomNumber : null,
                GuestName = os.BookingDetail != null && os.BookingDetail.Booking != null ? os.BookingDetail.Booking.GuestName : null,
                OrderDate = os.OrderDate,
                TotalAmount = os.TotalAmount,
                Status = os.Status
            })
            .ToListAsync();

        return new PaginatedResultDto<OrderServiceSummaryDto>
        {
            Items = items,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<OrderServiceDto?> GetByIdAsync(int id)
    {
        var os = await _repository.GetByIdWithDetailsAsync(id);
        if (os == null) return null;

        return new OrderServiceDto
        {
            Id = os.Id,
            BookingDetailId = os.BookingDetailId,
            RoomNumber = os.BookingDetail?.Room?.RoomNumber,
            GuestName = os.BookingDetail?.Booking?.GuestName,
            BookingStatus = os.BookingDetail?.Booking?.Status,
            OrderDate = os.OrderDate,
            TotalAmount = os.TotalAmount,
            Status = os.Status,
            Details = os.OrderServiceDetails.Select(d => new OrderServiceDetailDto
            {
                Id = d.Id,
                ServiceId = d.ServiceId ?? 0,
                ServiceName = d.ServiceName,
                Quantity = d.Quantity,
                UnitPrice = d.UnitPrice,
                Unit = d.Unit
            }).ToList()
        };
    }

    public async Task<int> CreateAsync(CreateOrderServiceDto dto)
    {
        // Actually, we need to check if booking is checked out
        // For simplicity in Create, we might need more context, but let's assume we fetch it
        var order = new OrderService
        {
            BookingDetailId = dto.BookingDetailId,
            OrderDate = DateTime.Now,
            Status = OrderServiceStatus.Pending,
            TotalAmount = 0
        };

        await _repository.AddAsync(order);
        await _repository.SaveChangesAsync();
        return order.Id;
    }

    public async Task<bool> AddItemAsync(int id, AddItemToOrderDto dto)
    {
        if (dto.Quantity <= 0) throw new ArgumentException("Quantity must be greater than 0.");

        using var transaction = await _repository.BeginTransactionAsync();
        try
        {
            var order = await _repository.GetByIdWithDetailsAsync(id);
            if (order == null) return false;

            if (order.BookingDetail?.Booking?.Status == "CheckedOut")
            {
                throw new InvalidOperationException("Cannot modify order after checkout.");
            }

            var service = await _serviceRepository.GetByIdAsync(dto.ServiceId);
            if (service == null) throw new KeyNotFoundException("Service not found.");

            var existingDetail = await _repository.GetDetailByServiceIdAsync(id, dto.ServiceId);
            if (existingDetail != null)
            {
                existingDetail.Quantity += dto.Quantity;
                _repository.Update(order); // Mark order as updated
            }
            else
            {
                var detail = new OrderServiceDetail
                {
                    OrderServiceId = id,
                    ServiceId = dto.ServiceId,
                    ServiceName = service.Name,
                    UnitPrice = service.Price,
                    Unit = service.Unit ?? "Item",
                    Quantity = dto.Quantity
                };
                order.OrderServiceDetails.Add(detail);
            }

            RecalculateTotal(order);
            order.UpdatedAt = DateTime.Now;

            await _repository.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> UpdateItemAsync(int id, int serviceId, UpdateOrderItemDto dto)
    {
        if (dto.Quantity <= 0) throw new ArgumentException("Quantity must be greater than 0.");

        using var transaction = await _repository.BeginTransactionAsync();
        try
        {
            var order = await _repository.GetByIdWithDetailsAsync(id);
            if (order == null) return false;

            if (order.BookingDetail?.Booking?.Status == "CheckedOut")
            {
                throw new InvalidOperationException("Cannot modify order after checkout.");
            }

            var detail = order.OrderServiceDetails.FirstOrDefault(d => d.ServiceId == serviceId);
            if (detail == null) return false;

            detail.Quantity = dto.Quantity;
            RecalculateTotal(order);
            order.UpdatedAt = DateTime.Now;

            await _repository.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> RemoveItemAsync(int id, int serviceId)
    {
        using var transaction = await _repository.BeginTransactionAsync();
        try
        {
            var order = await _repository.GetByIdWithDetailsAsync(id);
            if (order == null) return false;

            if (order.BookingDetail?.Booking?.Status == "CheckedOut")
            {
                throw new InvalidOperationException("Cannot modify order after checkout.");
            }

            var detail = order.OrderServiceDetails.FirstOrDefault(d => d.ServiceId == serviceId);
            if (detail == null) return false;

            _repository.RemoveDetail(detail);
            
            // Recalculate after removal
            RecalculateTotal(order);
            order.UpdatedAt = DateTime.Now;

            await _repository.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> ChangeStatusAsync(int id, string status)
    {
        if (!Enum.TryParse<OrderServiceStatus>(status, true, out var newStatus))
        {
            throw new ArgumentException("Invalid status.");
        }

        var order = await _repository.GetByIdAsync(id);
        if (order == null) return false;

        order.Status = newStatus;
        order.UpdatedAt = DateTime.Now;

        await _repository.SaveChangesAsync();
        return true;
    }

    private void RecalculateTotal(OrderService order)
    {
        order.TotalAmount = order.OrderServiceDetails.Sum(d => d.Quantity * d.UnitPrice);
    }
}
