using HotelManagement.Repositories.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

public class AuditLogCleanupBackgroundService : BackgroundService
{
    private const string VietnamTimeZoneId = "SE Asia Standard Time";
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromHours(24);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuditLogCleanupBackgroundService> _logger;

    public AuditLogCleanupBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<AuditLogCleanupBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Give the host some time to start up
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        await CleanupOnceAsync(stoppingToken);

        using var timer = new PeriodicTimer(CleanupInterval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await CleanupOnceAsync(stoppingToken);
        }
    }

    private async Task CleanupOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var repository = scope.ServiceProvider.GetRequiredService<IAuditLogRepository>();
            var cutoffDate = ResolveCutoffDate();

            var deletedCount = await repository.DeleteOlderThanAsync(cutoffDate, cancellationToken);
            if (deletedCount > 0)
            {
                _logger.LogInformation(
                    "Deleted {DeletedCount} audit log bucket(s) older than {CutoffDate:yyyy-MM-dd}.",
                    deletedCount,
                    cutoffDate.Date);
            }
        }
        catch (OperationCanceledException)
        {
            // Ignore shutdown cancellation.
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Audit log cleanup job failed.");
        }
    }

    private static DateTime ResolveCutoffDate()
    {
        var timeZone = ResolveVietnamTimeZone();
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
        var cutoffDate = DateOnly.FromDateTime(localNow).AddMonths(-3);
        return cutoffDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
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
}