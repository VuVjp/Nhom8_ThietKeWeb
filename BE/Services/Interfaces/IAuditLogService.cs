using HotelManagement.Dtos;

public interface IAuditLogService
{
    Task CreateAuditLogAsync(AuditLogCreateDto dto, CancellationToken cancellationToken = default);
    Task<List<AuditLogDailyGroupDto>> GetAllAsync(AuditLogQueryDto query, CancellationToken cancellationToken = default);
    Task<PaginatedResultDto<AuditLogDailyGroupDto>> GetPagedAsync(AuditLogQueryDto query, CancellationToken cancellationToken = default);
}
