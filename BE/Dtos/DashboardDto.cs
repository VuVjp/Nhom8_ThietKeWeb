namespace HotelManagement.Dtos;

public class DashboardOverviewDto
{
    public decimal TotalRevenue { get; set; }
    public int BookingCount { get; set; }
    public int OccupancyRate { get; set; }
    public int AuditLogTotal { get; set; } = 0;
    public RoomOccupancySummaryDto Occupancy { get; set; } = new();
    public List<DashboardRevenuePointDto> RevenueChartData { get; set; } = new();
    public List<DashboardRoomStatusPointDto> StatusChartData { get; set; } = new();
    public List<DashboardRecentBookingDto> RecentBookings { get; set; } = new();
    public List<DashboardCriticalAlertDto> CriticalAlerts { get; set; } = new();
    public List<DashboardPendingServiceDto> PendingServices { get; set; } = new();
}

public class RoomOccupancySummaryDto
{
    public int Total { get; set; }
    public int Occupied { get; set; }
    public int Maintenance { get; set; }
    public int Available { get; set; }
}

public class DashboardRevenuePointDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Bookings { get; set; }
}

public class DashboardRoomStatusPointDto
{
    public string Name { get; set; } = string.Empty;
    public int Value { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class DashboardRecentBookingDto
{
    public int Id { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class DashboardCriticalAlertDto
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public decimal Penalty { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class DashboardPendingServiceDto
{
    public int Id { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
}