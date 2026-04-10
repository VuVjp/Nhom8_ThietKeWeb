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

        var completedOrders = orders
            .Where(item => item.Status == OrderServiceStatus.Completed)
            .ToList();

        var bookingRevenue = confirmedBookings.Sum(item => item.FinalPrice);
        var serviceRevenue = completedOrders.Sum(item => item.TotalAmount);
        var totalRevenue = bookingRevenue + serviceRevenue;

        var occupancy = BuildOccupancySummary(rooms);

        var revenueChartData = BuildRevenueChartData(startDate, normalizedDays, confirmedBookings, completedOrders);

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
            AuditLogTotal = 0,
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
        IEnumerable<BookingProjection> confirmedBookings,
        IEnumerable<OrderProjection> completedOrders)
    {
        var bookingDaily = confirmedBookings
            .Where(item => item.CheckInDate != null)
            .GroupBy(item => item.CheckInDate!.Value.Date)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.FinalPrice));

        var bookingCountDaily = confirmedBookings
            .Where(item => item.CheckInDate != null)
            .GroupBy(item => item.CheckInDate!.Value.Date)
            .ToDictionary(group => group.Key, group => group.Count());

        var serviceDaily = completedOrders
            .GroupBy(item => item.OrderDate.Date)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.TotalAmount));

        var result = new List<DashboardRevenuePointDto>(days);
        for (var i = 0; i < days; i++)
        {
            var date = startDate.AddDays(i).Date;
            bookingDaily.TryGetValue(date, out var bookingRevenue);
            serviceDaily.TryGetValue(date, out var serviceRevenue);
            bookingCountDaily.TryGetValue(date, out var bookingCount);

            result.Add(new DashboardRevenuePointDto
            {
                Name = date.ToString("dd/MM"),
                Revenue = bookingRevenue + serviceRevenue,
                Bookings = bookingCount,
            });
        }

        return result;
    }
}