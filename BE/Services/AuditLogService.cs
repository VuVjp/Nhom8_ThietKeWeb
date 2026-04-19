using System.Text.Json;
using HotelManagement.Dtos;
using HotelManagement.Entities;

public class AuditLogService : IAuditLogService
{
    private const string VietnamTimeZoneId = "SE Asia Standard Time";
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly TimeZoneInfo _vietnamTimeZone;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    public AuditLogService(IAuditLogRepository auditLogRepository)
    {
        _auditLogRepository = auditLogRepository;
        _vietnamTimeZone = ResolveVietnamTimeZone();
    }

    public async Task CreateAuditLogAsync(AuditLogCreateDto dto, CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var localDate = ResolveLocalDate(nowUtc);
        var auditDate = new DateTime(localDate.Year, localDate.Month, localDate.Day, 0, 0, 0, DateTimeKind.Unspecified);

        var auditEvent = new AuditLogEventDto
        {
            EventId = Guid.NewGuid().ToString(),
            Timestamp = nowUtc,
            ActionType = NormalizeActionType(dto.ActionType),
            EntityType = dto.EntityType,
            Context = BuildEventContext(dto.Context, dto.UserId),
            Changes = new AuditLogChangesDto
            {
                OldData = dto.OldData,
                NewData = dto.NewData,
            },
            Message = dto.Message,
        };

        await _auditLogRepository.AppendEventAsync(dto.UserId, auditDate, auditEvent, cancellationToken);
    }

    public async Task<List<AuditLogDailyGroupDto>> GetAllAsync(AuditLogQueryDto query, CancellationToken cancellationToken = default)
    {
        var buckets = await _auditLogRepository.GetDailyBucketsAsync(cancellationToken);
        return ApplyFilters(MapToDailyGroups(buckets), query);
    }

    public async Task<PaginatedResultDto<AuditLogDailyGroupDto>> GetPagedAsync(AuditLogQueryDto query, CancellationToken cancellationToken = default)
    {
        var normalizedPage = query.Page <= 0 ? 1 : query.Page;
        var normalizedPageSize = query.PageSize <= 0 ? 20 : Math.Min(query.PageSize, 200);
        var buckets = await _auditLogRepository.GetDailyBucketsAsync(cancellationToken);
        var filtered = ApplyFilters(MapToDailyGroups(buckets), query);

        var items = filtered
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToList();

        return new PaginatedResultDto<AuditLogDailyGroupDto>
        {
            Items = items,
            Total = filtered.Count,
            Page = normalizedPage,
            PageSize = normalizedPageSize,
        };
    }

    private List<AuditLogDailyGroupDto> MapToDailyGroups(IEnumerable<AuditLog> buckets)
    {
        var groups = new List<AuditLogDailyGroupDto>();

        foreach (var bucket in buckets)
        {
            var payload = Deserialize<AuditLogBucketPayload>(bucket.EventJson) ?? new AuditLogBucketPayload();
            var events = payload.Events
                .Select(evt => EnrichEventContext(evt, bucket.UserId, bucket.User?.FullName, bucket.User?.Email))
                .OrderByDescending(evt => evt.Timestamp)
                .ToList();

            groups.Add(new AuditLogDailyGroupDto
            {
                Date = bucket.AuditDate.ToString("yyyy-MM-dd"),
                UserId = bucket.UserId,
                TotalEvents = events.Count,
                Events = events,
            });
        }

        return groups
            .OrderByDescending(group => group.Date)
            .ThenByDescending(group => group.TotalEvents)
            .ToList();
    }

    private List<AuditLogDailyGroupDto> ApplyFilters(List<AuditLogDailyGroupDto> groups, AuditLogQueryDto query)
    {
        DateOnly? fromDate = query.From.HasValue ? DateOnly.FromDateTime(query.From.Value) : null;
        DateOnly? toDate = query.To.HasValue ? DateOnly.FromDateTime(query.To.Value) : null;
        var actionFilter = query.ActionType?.Trim().ToUpperInvariant();
        var entityFilter = query.EntityType?.Trim();
        var search = query.Search?.Trim();

        var filteredGroups = new List<AuditLogDailyGroupDto>();

        foreach (var group in groups)
        {
            var groupDate = DateOnly.Parse(group.Date);
            if (fromDate.HasValue && groupDate < fromDate.Value)
            {
                continue;
            }

            if (toDate.HasValue && groupDate > toDate.Value)
            {
                continue;
            }

            var matchedEvents = group.Events
                .Where(evt => MatchEvent(evt, actionFilter, entityFilter, search))
                .ToList();

            if (matchedEvents.Count == 0)
            {
                continue;
            }

            filteredGroups.Add(new AuditLogDailyGroupDto
            {
                Date = group.Date,
                UserId = group.UserId,
                TotalEvents = matchedEvents.Count,
                Events = matchedEvents,
            });
        }

        return filteredGroups
            .OrderByDescending(group => group.Date)
            .ThenByDescending(group => group.TotalEvents)
            .ToList();
    }

    private static bool MatchEvent(AuditLogEventDto evt, string? actionFilter, string? entityFilter, string? search)
    {
        if (!string.IsNullOrWhiteSpace(actionFilter) && !evt.ActionType.Equals(actionFilter, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(entityFilter) && !evt.EntityType.Equals(entityFilter, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(search))
        {
            return true;
        }

        var searchLower = search.ToLowerInvariant();
        if ((evt.Message ?? string.Empty).ToLowerInvariant().Contains(searchLower)
            || evt.ActionType.ToLowerInvariant().Contains(searchLower)
            || evt.EntityType.ToLowerInvariant().Contains(searchLower))
        {
            return true;
        }

        if (evt.Context.Any(kvp => (kvp.Key ?? string.Empty).ToLowerInvariant().Contains(searchLower)
            || (kvp.Value?.ToString() ?? string.Empty).ToLowerInvariant().Contains(searchLower)))
        {
            return true;
        }

        return false;
    }

    private AuditLogEventDto EnrichEventContext(AuditLogEventDto evt, int? userId, string? userName, string? userEmail)
    {
        var context = new Dictionary<string, object?>(evt.Context, StringComparer.OrdinalIgnoreCase)
        {
            ["userId"] = userId,
        };

        if (!string.IsNullOrWhiteSpace(userName))
        {
            context["userName"] = userName;
        }

        if (!string.IsNullOrWhiteSpace(userEmail))
        {
            context["userEmail"] = userEmail;
        }

        return new AuditLogEventDto
        {
            EventId = evt.EventId,
            Timestamp = evt.Timestamp,
            ActionType = evt.ActionType,
            EntityType = evt.EntityType,
            Context = context,
            Changes = evt.Changes,
            Message = evt.Message,
        };
    }

    private DateOnly ResolveLocalDate(DateTime utcDateTime)
    {
        var safeUtc = utcDateTime.Kind == DateTimeKind.Utc ? utcDateTime : DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
        var local = TimeZoneInfo.ConvertTimeFromUtc(safeUtc, _vietnamTimeZone);
        return DateOnly.FromDateTime(local);
    }

    private static TimeZoneInfo ResolveVietnamTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(VietnamTimeZoneId);
        }
        catch
        {
            return TimeZoneInfo.Utc;
        }
    }

    private static Dictionary<string, object?> BuildEventContext(Dictionary<string, object?> context, int? userId)
    {
        var result = new Dictionary<string, object?>(context, StringComparer.OrdinalIgnoreCase)
        {
            ["userId"] = userId,
        };

        return result;
    }

    private static string NormalizeActionType(string? action)
    {
        var normalized = action?.Trim().ToUpperInvariant();

        return normalized switch
        {
            "POST" => "CREATE",
            "PUT" => "UPDATE",
            "PATCH" => "UPDATE",
            "DELETE" => "DELETE",
            "LOGIN" => "LOGIN",
            "LOGOUT" => "LOGOUT",
            "STATUSCHANGE" => "STATUS_CHANGE",
            null or "" => "OTHER",
            _ => normalized,
        };
    }

    private T? Deserialize<T>(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return default;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(json, _jsonOptions);
        }
        catch
        {
            return default;
        }
    }

    private sealed class AuditLogBucketPayload
    {
        public int TotalEvents { get; set; }
        public List<AuditLogEventDto> Events { get; set; } = new();
    }
}
