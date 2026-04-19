import { httpClient } from './httpClient';

export interface DashboardRevenuePoint {
    name: string;
    revenue: number;
    bookings: number;
}

export interface DashboardRoomStatusPoint {
    name: string;
    value: number;
    color: string;
}

export interface DashboardRecentBooking {
    id: number;
    guestName: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    status: string;
}

export interface DashboardCriticalAlert {
    id: string | number;
    itemName: string;
    room: string;
    penalty: number;
    description: string;
}

export interface DashboardPendingService {
    id: number;
    roomNumber: string;
    guestName: string;
    orderDate: string;
}

export interface DashboardOverview {
    totalRevenue: number;
    bookingCount: number;
    occupancyRate: number;
    auditLogTotal: number;
    occupancy: {
        total: number;
        occupied: number;
        maintenance: number;
        available: number;
    };
    revenueChartData: DashboardRevenuePoint[];
    statusChartData: DashboardRoomStatusPoint[];
    recentBookings: DashboardRecentBooking[];
    criticalAlerts: DashboardCriticalAlert[];
    pendingServices: DashboardPendingService[];
}

const emptyOverview: DashboardOverview = {
    totalRevenue: 0,
    bookingCount: 0,
    occupancyRate: 0,
    auditLogTotal: 0,
    occupancy: {
        total: 0,
        occupied: 0,
        maintenance: 0,
        available: 0,
    },
    revenueChartData: [],
    statusChartData: [],
    recentBookings: [],
    criticalAlerts: [],
    pendingServices: [],
};

function pick<T = unknown>(source: Record<string, unknown>, camel: string, pascal: string): T | undefined {
    return (source[camel] as T | undefined) ?? (source[pascal] as T | undefined);
}

function normalizeDashboardOverview(raw: unknown): DashboardOverview {
    if (!raw || typeof raw !== 'object') {
        return emptyOverview;
    }

    const src = raw as Record<string, unknown>;
    const occupancyRaw = pick<Record<string, unknown>>(src, 'occupancy', 'Occupancy') ?? {};

    const revenueRaw = pick<unknown[]>(src, 'revenueChartData', 'RevenueChartData');
    const statusRaw = pick<unknown[]>(src, 'statusChartData', 'StatusChartData');
    const bookingsRaw = pick<unknown[]>(src, 'recentBookings', 'RecentBookings');
    const alertsRaw = pick<unknown[]>(src, 'criticalAlerts', 'CriticalAlerts');
    const pendingRaw = pick<unknown[]>(src, 'pendingServices', 'PendingServices');

    const revenueChartData = Array.isArray(revenueRaw) ? revenueRaw : [];
    const statusChartData = Array.isArray(statusRaw) ? statusRaw : [];
    const recentBookings = Array.isArray(bookingsRaw) ? bookingsRaw : [];
    const criticalAlerts = Array.isArray(alertsRaw) ? alertsRaw : [];
    const pendingServices = Array.isArray(pendingRaw) ? pendingRaw : [];

    return {
        totalRevenue: Number(pick(src, 'totalRevenue', 'TotalRevenue') ?? 0),
        bookingCount: Number(pick(src, 'bookingCount', 'BookingCount') ?? 0),
        occupancyRate: Number(pick(src, 'occupancyRate', 'OccupancyRate') ?? 0),
        auditLogTotal: Number(pick(src, 'auditLogTotal', 'AuditLogTotal') ?? 0),
        occupancy: {
            total: Number(pick(occupancyRaw, 'total', 'Total') ?? 0),
            occupied: Number(pick(occupancyRaw, 'occupied', 'Occupied') ?? 0),
            maintenance: Number(pick(occupancyRaw, 'maintenance', 'Maintenance') ?? 0),
            available: Number(pick(occupancyRaw, 'available', 'Available') ?? 0),
        },
        revenueChartData: revenueChartData.map((item: any) => ({
            name: String(item?.name ?? item?.Name ?? ''),
            revenue: Number(item?.revenue ?? item?.Revenue ?? 0),
            bookings: Number(item?.bookings ?? item?.Bookings ?? 0),
        })),
        statusChartData: statusChartData.map((item: any) => ({
            name: String(item?.name ?? item?.Name ?? ''),
            value: Number(item?.value ?? item?.Value ?? 0),
            color: String(item?.color ?? item?.Color ?? '#0ea5e9'),
        })),
        recentBookings: recentBookings.map((item: any) => ({
            id: Number(item?.id ?? item?.Id ?? 0),
            guestName: String(item?.guestName ?? item?.GuestName ?? 'Unknown'),
            checkInDate: String(item?.checkInDate ?? item?.CheckInDate ?? ''),
            checkOutDate: String(item?.checkOutDate ?? item?.CheckOutDate ?? ''),
            totalAmount: Number(item?.totalAmount ?? item?.TotalAmount ?? 0),
            status: String(item?.status ?? item?.Status ?? 'Pending'),
        })),
        criticalAlerts: criticalAlerts.map((item: any) => ({
            id: Number(item?.id ?? item?.Id ?? 0),
            itemName: String(item?.itemName ?? item?.ItemName ?? 'Unknown'),
            room: String(item?.room ?? item?.Room ?? 'Unknown'),
            penalty: Number(item?.penalty ?? item?.Penalty ?? 0),
            description: String(item?.description ?? item?.Description ?? ''),
        })),
        pendingServices: pendingServices.map((item: any) => ({
            id: Number(item?.id ?? item?.Id ?? 0),
            roomNumber: String(item?.roomNumber ?? item?.RoomNumber ?? 'N/A'),
            guestName: String(item?.guestName ?? item?.GuestName ?? 'Unknown'),
            orderDate: String(item?.orderDate ?? item?.OrderDate ?? ''),
        })),
    };
}

export const dashboardApi = {
    async getOverview(days = 7): Promise<DashboardOverview> {
        const { data } = await httpClient.get<unknown>('dashboard/overview', {
            params: { days },
        });

        return normalizeDashboardOverview(data);
    },
};