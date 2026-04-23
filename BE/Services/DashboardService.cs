using HotelManagement.Data;
using HotelManagement.Dtos;
using HotelManagement.Enums;
using HotelManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Services.Implementations;

public class DashboardService : IDashboardService
{
    private static readonly HashSet<string> RevenueBookingStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Confirmed",
        "CheckedIn",
        "CheckedOut",
    };

    private readonly AppDbContext _context;

    private sealed class BookingProjection
    {
        public int Id { get; set; }
        public string? GuestName { get; set; }
        public string? Status { get; set; }
        public decimal FinalPrice { get; set; }
        public DateTime? CheckInDate { get; set; }
        public DateTime? CheckOutDate { get; set; }
    }

    private sealed class OrderProjection
    {
        public int Id { get; set; }
        public OrderServiceStatus Status { get; set; }
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? RoomNumber { get; set; }
        public string? GuestName { get; set; }
    }

    private sealed class RoomProjection
    {
        public string? Status { get; set; }
        public string? CleaningStatus { get; set; }
    }

    private sealed class PaymentProjection
    {
        public decimal AmountPaid { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string? Status { get; set; }
        public string? PaymentForType { get; set; }
    }

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardOverviewDto> GetOverviewAsync(int days = 7)
    {
        var normalizedDays = Math.Clamp(days, 1, 31);
        var endDate = DateTime.Today;
        var startDate = endDate.AddDays(-(normalizedDays - 1));

        var bookings = await _context.Bookings
            .AsNoTracking()
            .Select(booking => new BookingProjection
            {
                Id = booking.Id,
                GuestName = booking.GuestName,
                Status = booking.Status,
                FinalPrice = booking.FinalPrice,
                CheckInDate = booking.BookingDetails
                    .OrderBy(detail => detail.CheckInDate)
                    .Select(detail => (DateTime?)detail.CheckInDate)
                    .FirstOrDefault(),
                CheckOutDate = booking.BookingDetails
                    .OrderByDescending(detail => detail.CheckOutDate)
                    .Select(detail => (DateTime?)detail.CheckOutDate)
                    .FirstOrDefault(),
            })
            .ToListAsync();

        var orders = await _context.OrderServices
            .AsNoTracking()
            .Select(order => new OrderProjection
            {
                Id = order.Id,
                Status = order.Status,
                OrderDate = order.OrderDate,
                TotalAmount = order.TotalAmount,
                RoomNumber = order.BookingDetail != null && order.BookingDetail.Room != null
                    ? order.BookingDetail.Room.RoomNumber
                    : null,
                GuestName = order.BookingDetail != null && order.BookingDetail.Booking != null
                    ? order.BookingDetail.Booking.GuestName
                    : null,
            })
            .ToListAsync();

        var rooms = await _context.Rooms
            .AsNoTracking()
            .Select(room => new RoomProjection
            {
                Status = room.Status,
                CleaningStatus = room.CleaningStatus,
            })
            .ToListAsync();

        var auditLogCount = await _context.AuditLogs.CountAsync();

        var payments = await _context.Payments
            .AsNoTracking()
            .Select(payment => new PaymentProjection
            {
                AmountPaid = payment.AmountPaid,
                PaymentDate = payment.PaymentDate,
                Status = payment.Status,
                PaymentForType = payment.PaymentForType,
            })
            .ToListAsync();

        var criticalAlerts = await _context.LossAndDamages
            .AsNoTracking()
            .OrderByDescending(item => item.CreatedAt)
            .Take(3)
            .Select(item => new DashboardCriticalAlertDto
            {
                Id = item.Id,
                ItemName = item.RoomInventory != null && !string.IsNullOrWhiteSpace(item.RoomInventory.ItemName)
                    ? item.RoomInventory.ItemName!
                    : "Unknown",
                Room = item.RoomInventory != null && item.RoomInventory.Room != null && !string.IsNullOrWhiteSpace(item.RoomInventory.Room.RoomNumber)
                    ? item.RoomInventory.Room.RoomNumber
                    : "Unknown",
                Penalty = item.PenaltyAmount,
                Description = string.IsNullOrWhiteSpace(item.Description) ? "No description" : item.Description,
            })
            .ToListAsync();

        var confirmedBookings = bookings
            .Where(item => !string.IsNullOrWhiteSpace(item.Status) && RevenueBookingStatuses.Contains(item.Status!))
            .ToList();

        var successfulPayments = payments
            .Where(IsSuccessfulPayment)
            .ToList();

        var totalRevenue = successfulPayments.Sum(item => item.AmountPaid);

        var occupancy = BuildOccupancySummary(rooms);

        var revenueChartData = BuildRevenueChartData(startDate, normalizedDays, successfulPayments);

        var statusChartData = new List<DashboardRoomStatusPointDto>
        {
            new() { Name = "Available", Value = occupancy.Available, Color = "#0ea5e9" },
            new() { Name = "Occupied", Value = occupancy.Occupied, Color = "#6366f1" },
            new() { Name = "Maintenance", Value = occupancy.Maintenance, Color = "#f59e0b" },
        };

        var recentBookings = confirmedBookings
            .OrderByDescending(item => item.Id)
            .Take(5)
            .Select(item => new DashboardRecentBookingDto
            {
                Id = item.Id,
                GuestName = string.IsNullOrWhiteSpace(item.GuestName) ? "Unknown" : item.GuestName,
                CheckInDate = item.CheckInDate ?? DateTime.Today,
                CheckOutDate = item.CheckOutDate ?? DateTime.Today,
                TotalAmount = item.FinalPrice,
                Status = string.IsNullOrWhiteSpace(item.Status) ? "Pending" : item.Status,
            })
            .ToList();

        var pendingServices = orders
            .Where(item => item.Status == OrderServiceStatus.Pending)
            .OrderByDescending(item => item.OrderDate)
            .Take(3)
            .Select(item => new DashboardPendingServiceDto
            {
                Id = item.Id,
                RoomNumber = string.IsNullOrWhiteSpace(item.RoomNumber) ? "N/A" : item.RoomNumber,
                GuestName = string.IsNullOrWhiteSpace(item.GuestName) ? "Unknown" : item.GuestName,
                OrderDate = item.OrderDate,
            })
            .ToList();

        return new DashboardOverviewDto
        {
            TotalRevenue = totalRevenue,
            BookingCount = confirmedBookings.Count,
            OccupancyRate = occupancy.Total == 0 ? 0 : (int)Math.Round((double)occupancy.Occupied / occupancy.Total * 100),
            AuditLogTotal = auditLogCount,
            Occupancy = occupancy,
            RevenueChartData = revenueChartData,
            StatusChartData = statusChartData,
            RecentBookings = recentBookings,
            CriticalAlerts = criticalAlerts,
            PendingServices = pendingServices,
        };
    }

    private static RoomOccupancySummaryDto BuildOccupancySummary(IEnumerable<RoomProjection> rooms)
    {
        var roomList = rooms.ToList();

        var occupied = roomList.Count(room => string.Equals(room.Status, "Occupied", StringComparison.OrdinalIgnoreCase));
        var available = roomList.Count(room => string.Equals(room.Status, "Available", StringComparison.OrdinalIgnoreCase));
        var maintenance = roomList.Count(room =>
            string.Equals(room.Status, "Maintenance", StringComparison.OrdinalIgnoreCase)
            || string.Equals(room.CleaningStatus, "Dirty", StringComparison.OrdinalIgnoreCase)
            || string.Equals(room.CleaningStatus, "Cleaning", StringComparison.OrdinalIgnoreCase));

        return new RoomOccupancySummaryDto
        {
            Total = roomList.Count,
            Occupied = occupied,
            Available = available,
            Maintenance = maintenance,
        };
    }

    private static List<DashboardRevenuePointDto> BuildRevenueChartData(
        DateTime startDate,
        int days,
        IEnumerable<PaymentProjection> successfulPayments)
    {
        var paymentDaily = successfulPayments
            .Where(item => item.PaymentDate != null)
            .GroupBy(item => item.PaymentDate!.Value.Date)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.AmountPaid));

        var bookingCountDaily = successfulPayments
            .Where(item => item.PaymentDate != null)
            .Where(item => string.Equals(item.PaymentForType, "booking", StringComparison.OrdinalIgnoreCase))
            .GroupBy(item => item.PaymentDate!.Value.Date)
            .ToDictionary(group => group.Key, group => group.Count());

        var result = new List<DashboardRevenuePointDto>(days);
        for (var i = 0; i < days; i++)
        {
            var date = startDate.AddDays(i).Date;
            paymentDaily.TryGetValue(date, out var paymentRevenue);
            bookingCountDaily.TryGetValue(date, out var bookingCount);

            result.Add(new DashboardRevenuePointDto
            {
                Name = date.ToString("dd/MM"),
                Revenue = paymentRevenue,
                Bookings = bookingCount,
            });
        }

        return result;
    }

    private static bool IsSuccessfulPayment(PaymentProjection payment)
    {
        if (payment.PaymentDate == null)
        {
            return false;
        }

        // Backward compatibility: older rows may not have status but are already valid payments.
        return string.IsNullOrWhiteSpace(payment.Status)
            || string.Equals(payment.Status, "Completed", StringComparison.OrdinalIgnoreCase);
    }
}