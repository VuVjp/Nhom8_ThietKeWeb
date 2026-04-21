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
                    await ProcessOverdueBookingsAsync(currentSettings.CheckInGraceMinutes, currentSettings.PendingGraceMinutes, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Auto-cancel overdue bookings job failed.");
            }

            await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);
        }
    }

    private async Task ProcessOverdueBookingsAsync(int checkInGraceMinutes, int pendingGraceMinutes, CancellationToken cancellationToken)
    {
        var graceMinutesCheckIn = Math.Max(1, checkInGraceMinutes);
        var graceMinutesPending = Math.Max(1, pendingGraceMinutes);
        var cutoffTimeConfirmed = DateTime.Now.AddMinutes(-graceMinutesCheckIn);
        var cutoffTimePending = DateTime.Now.AddMinutes(-graceMinutesPending);

        using var scope = _scopeFactory.CreateScope();
        var bookingRepository = scope.ServiceProvider.GetRequiredService<IBookingRepository>();
        var bookingService = scope.ServiceProvider.GetRequiredService<IBookingService>();

        var overdueBookingIds = await bookingRepository.GetOverdueCheckInBookingIdsAsync(cutoffTimeConfirmed, cutoffTimePending);
        var pendingBookings = overdueBookingIds.PendingBookingIds;
        var confirmedBookings = overdueBookingIds.ConfirmedBookingIds;

        if (overdueBookingIds.PendingBookingIds.Count == 0 && overdueBookingIds.ConfirmedBookingIds.Count == 0)
        {
            return;
        }

        var cancelledCount = 0;

        foreach (var bookingId in pendingBookings)
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
        foreach (var bookingId in confirmedBookings)
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
            _logger.LogInformation("Auto-cancelled {CancelledCount} overdue bookings ({PendingCount} pending, {ConfirmedCount} confirmed).", cancelledCount, pendingBookings.Count, confirmedBookings.Count);
        }
    }
}
