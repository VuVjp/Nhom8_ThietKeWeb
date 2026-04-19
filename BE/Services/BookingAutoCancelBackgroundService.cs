using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace HotelManagement.Services.Implementations;

public class BookingAutoCancelBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BookingAutoCancelBackgroundService> _logger;
    private readonly IOptionsMonitor<BookingAutoCancelSettings> _settings;

    public BookingAutoCancelBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<BookingAutoCancelBackgroundService> logger,
        IOptionsMonitor<BookingAutoCancelSettings> settings)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _settings = settings;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var currentSettings = _settings.CurrentValue;
            var intervalMinutes = Math.Max(1, currentSettings.ScanIntervalMinutes);

            try
            {
                if (currentSettings.Enabled)
                {
                    await ProcessOverdueBookingsAsync(currentSettings.CheckInGraceMinutes, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Auto-cancel overdue bookings job failed.");
            }

            await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);
        }
    }

    private async Task ProcessOverdueBookingsAsync(int checkInGraceMinutes, CancellationToken cancellationToken)
    {
        var graceMinutes = Math.Max(1, checkInGraceMinutes);
        var cutoffTime = DateTime.Now.AddMinutes(-graceMinutes);

        using var scope = _scopeFactory.CreateScope();
        var bookingRepository = scope.ServiceProvider.GetRequiredService<IBookingRepository>();
        var bookingService = scope.ServiceProvider.GetRequiredService<IBookingService>();

        var overdueBookingIds = await bookingRepository.GetOverdueCheckInBookingIdsAsync(cutoffTime);

        if (overdueBookingIds.Count == 0)
        {
            return;
        }

        var cancelledCount = 0;

        foreach (var bookingId in overdueBookingIds)
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                var updated = await bookingService.ChangeBookingStatusAsync(bookingId, "Cancelled");
                if (updated)
                {
                    cancelledCount++;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Skip auto-cancel for booking {BookingId}.", bookingId);
            }
        }

        if (cancelledCount > 0)
        {
            _logger.LogInformation(
                "Auto-cancelled {CancelledCount} overdue booking(s) with check-in older than {GraceMinutes} minutes.",
                cancelledCount,
                graceMinutes);
        }
    }
}
