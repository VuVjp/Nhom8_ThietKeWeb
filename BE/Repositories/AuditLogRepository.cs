using HotelManagement.Data;
using HotelManagement.Dtos;
using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AppDbContext _context;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false,
    };

    public AuditLogRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AppendEventAsync(int? userId, DateTime auditDate, AuditLogEventDto auditEvent, CancellationToken cancellationToken = default)
    {
        var normalizedDate = auditDate.Date;

        var bucket = await _context.AuditLogs
            .FirstOrDefaultAsync(x =>
                x.UserId == userId
                && x.AuditDate == normalizedDate,
                cancellationToken);

        if (bucket == null)
        {
            var payload = new AuditLogBucketPayload
            {
                TotalEvents = 1,
                Events = [auditEvent],
            };

            await _context.AuditLogs.AddAsync(new AuditLog
            {
                UserId = userId,
                AuditDate = normalizedDate,
                EventJson = JsonSerializer.Serialize(payload, _jsonOptions),
                LastUpdatedAt = DateTime.UtcNow,
            }, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);
            return;
        }

        var existingPayload = DeserializePayload(bucket.EventJson);
        existingPayload.Events.Add(auditEvent);
        existingPayload.TotalEvents = existingPayload.Events.Count;

        bucket.EventJson = JsonSerializer.Serialize(existingPayload, _jsonOptions);
        bucket.LastUpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<AuditLog>> GetDailyBucketsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AuditLogs
            .Include(x => x.User)
            .AsNoTracking()
            .OrderByDescending(x => x.AuditDate)
            .ThenByDescending(x => x.LastUpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> DeleteOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default)
    {
        var normalizedCutoff = cutoffDate.Date;

        return await _context.AuditLogs
            .Where(x => x.AuditDate < normalizedCutoff)
            .ExecuteDeleteAsync(cancellationToken);
    }

    private AuditLogBucketPayload DeserializePayload(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new AuditLogBucketPayload();
        }

        try
        {
            return JsonSerializer.Deserialize<AuditLogBucketPayload>(json, _jsonOptions) ?? new AuditLogBucketPayload();
        }
        catch
        {
            return new AuditLogBucketPayload();
        }
    }

    private sealed class AuditLogBucketPayload
    {
        public int TotalEvents { get; set; }
        public List<AuditLogEventDto> Events { get; set; } = new();
    }
}
