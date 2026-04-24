using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using HotelManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Services;

public class BirthdayVoucherJob : BackgroundService
{
    private const string VietnamTimeZoneId = "SE Asia Standard Time";
    private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(24);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BirthdayVoucherJob> _logger;

    public BirthdayVoucherJob(
        IServiceScopeFactory scopeFactory,
        ILogger<BirthdayVoucherJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Birthday Voucher Job is starting.");

        // Wait a bit for the app to settle
        await Task.Delay(TimeSpan.FromSeconds(20), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessBirthdayVouchersAsync(stoppingToken);

            // Wait until next midnight or 24 hours
            var now = GetVietnamNow();
            var nextRun = now.Date.AddDays(1);
            var delay = nextRun - now;

            if (delay <= TimeSpan.Zero)
            {
                delay = CheckInterval;
            }

            _logger.LogInformation("Birthday Voucher Job will run again in {Delay}", delay);
            await Task.Delay(delay, stoppingToken);
        }
    }

    private async Task ProcessBirthdayVouchersAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
            var voucherRepository = scope.ServiceProvider.GetRequiredService<IVoucherRepository>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            var now = GetVietnamNow();
            var currentYear = now.Year;

            // Get users who have a birthday today
            // Note: EF Core translation for Month/Day of DateTime
            var users = await userRepository.GetQueryable()
                .Where(u => u.Birthday.HasValue 
                            && u.Birthday.Value.Month == now.Month 
                            && u.Birthday.Value.Day == now.Day
                            && (u.LastBirthdayVoucherYear == null || u.LastBirthdayVoucherYear < currentYear)
                            && u.CreatedAt <= now.AddDays(-30)
                            && (u.BirthdayUpdatedAt == null || EF.Functions.DateDiffDay(u.BirthdayUpdatedAt.Value, now) >= 7))
                .ToListAsync(cancellationToken);

            _logger.LogInformation("Found {Count} users with birthday today.", users.Count);

            foreach (var user in users)
            {
                try
                {
                    // Create voucher
                    var voucherCode = $"BDAY-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}-{currentYear}";
                    var voucher = new Voucher
                    {
                        Code = voucherCode,
                        DiscountType = "Percentage",
                        DiscountValue = 20, // Default 20%
                        ValidFrom = now.Date,
                        ValidTo = now.Date.AddDays(30),
                        UsageLimit = 1,
                        UsageCount = 0,
                        IsActive = true
                    };

                    await voucherRepository.AddAsync(voucher);
                    
                    // Update user
                    user.LastBirthdayVoucherYear = currentYear;
                    userRepository.Update(user);

                    await userRepository.SaveChangesAsync();

                    // Send Email
                    var emailBody = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                            <h2 style='color: #d32f2f; text-align: center;'>Happy Birthday, {user.FullName}! 🎂</h2>
                            <p>Wishing you a wonderful day filled with joy and happiness.</p>
                            <p>As a special gift from us, here is a birthday voucher for your next stay:</p>
                            <div style='background-color: #fce4ec; border: 2px dashed #f06292; padding: 15px; text-align: center; margin: 20px 0;'>
                                <span style='font-size: 24px; font-weight: bold; color: #c2185b;'>{voucherCode}</span>
                                <p style='margin-top: 10px; color: #880e4f;'><strong>20% OFF</strong> your next booking</p>
                            </div>
                            <p style='font-size: 14px; color: #666;'>
                                * This voucher is valid for 30 days from today.<br/>
                                * Usage limit: 1 time.
                            </p>
                            <p style='margin-top: 30px; text-align: center;'>Enjoy your day!<br/><strong>The Hotel Management Team</strong></p>
                        </div>";

                    await emailService.SendAsync(user.Email, "Happy Birthday! 🎂 A special gift for you", emailBody);

                    _logger.LogInformation("Sent birthday voucher to user {Email}", user.Email);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process birthday voucher for user {Email}", user.Email);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while processing birthday vouchers.");
        }
    }

    private DateTime GetVietnamNow()
    {
        try
        {
            var vietnamZone = TimeZoneInfo.FindSystemTimeZoneById(VietnamTimeZoneId);
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamZone);
        }
        catch
        {
            return DateTime.UtcNow.AddHours(7); // Fallback for Linux or if TZ not found
        }
    }
}
