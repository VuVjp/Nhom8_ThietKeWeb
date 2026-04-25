import { useQuery } from '@tanstack/react-query';
import {
    BanknotesIcon,
    ArrowPathIcon,
    CalendarDaysIcon,
    HomeIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { dashboardApi } from '../../api/dashboardApi';
import { toApiError } from '../../api/httpClient';
import toast from 'react-hot-toast';
import { Badge } from '../../components/Badge';
import { useState } from 'react';

// --- Sub-components for a Premium Look ---

interface MetricCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    trend?: { value: string; positive: boolean };
    icon: any;
    color: 'blue' | 'cyan' | 'emerald' | 'rose' | 'amber';
}

function MetricCard({ title, value, subValue, trend, icon: Icon, color }: MetricCardProps) {
    const gradients = {
        blue: 'from-blue-500/10 to-indigo-500/5 border-blue-100',
        cyan: 'from-cyan-500/10 to-blue-500/5 border-cyan-100',
        emerald: 'from-emerald-500/10 to-teal-500/5 border-emerald-100',
        rose: 'from-rose-500/10 to-pink-500/5 border-rose-100',
        amber: 'from-amber-500/10 to-orange-500/5 border-amber-100',
    };
    const iconColors = {
        blue: 'text-blue-600 bg-blue-50',
        cyan: 'text-cyan-600 bg-cyan-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        rose: 'text-rose-600 bg-rose-50',
        amber: 'text-amber-600 bg-amber-50',
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${gradients[color]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
                    <div className="mt-1 flex items-center gap-2">
                        {trend && (
                            <span className={`text-xs font-bold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {trend.positive ? '↑' : '↓'} {trend.value}
                            </span>
                        )}
                        <span className="text-xs text-slate-500 italic">{subValue}</span>
                    </div>
                </div>
                <div className={`rounded-xl p-3 shadow-sm bg-white ${iconColors[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            {/* Subtle background pattern */}
            <div className="absolute -right-4 -bottom-4 opacity-5 h-24 w-24">
                <Icon className="h-full w-full" />
            </div>
        </div>
    );
}

// --- Main Page Component ---

export function DashboardPage() {
    const {
        data: stats,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['dashboard-overview'],
        queryFn: () => dashboardApi.getOverview(7),
        retry: false,
        refetchOnWindowFocus: false,
    });

    const occupancy = stats?.occupancy ?? { total: 0, occupied: 0, maintenance: 0, available: 0 };
    const revenueChartData = stats?.revenueChartData ?? [];
    const statusChartData = stats?.statusChartData ?? [];
    const recentBookings = stats?.recentBookings ?? [];
    const criticalAlerts = stats?.criticalAlerts ?? [];
    const pendingServices = stats?.pendingServices ?? [];

    const [lastAsync, setLastAsync] = useState<Date | null>(new Date());

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 w-56 animate-pulse rounded-xl bg-slate-200" />
                        <div className="mt-2 h-4 w-80 animate-pulse rounded-lg bg-slate-100" />
                    </div>
                    <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200" />
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                            <div className="mt-3 h-9 w-32 animate-pulse rounded-xl bg-slate-200" />
                            <div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" />
                        </div>
                    ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2 h-[420px] animate-pulse bg-slate-50" />
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 h-[420px] animate-pulse bg-slate-50" />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center p-12 text-center">
                <ExclamationTriangleIcon className="h-16 w-16 text-rose-500 opacity-20" />
                <h3 className="mt-4 text-xl font-bold text-slate-900">Failed to load dashboard data</h3>
                <p className="mt-2 text-slate-500">Please check that the backend server is running and try again.</p>
                <p className="mt-1 text-xs text-slate-400">{toApiError(error).message}</p>
                <button
                    onClick={() => { void refetch(); }}
                    className="mt-6 rounded-xl bg-cyan-700 px-6 py-2.5 font-bold text-white shadow-lg hover:bg-cyan-800"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* --- Header Section --- */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Executive Overview</h2>
                    <p className="text-slate-500">Real-time performance metrics and operational monitoring.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end px-4 border-r border-slate-200">
                        <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Last Sync</span>
                        <span className="text-sm font-semibold text-slate-600">{lastAsync?.toLocaleTimeString() || 'Never'}</span>
                    </div>
                    <button
                        onClick={() => {
                            toast.loading('Syncing latest data...', { duration: 1000 });
                            void refetch();
                            setLastAsync(new Date());
                        }}
                        className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md active:scale-95"
                    >
                        <ArrowPathIcon className={`h-5 w-5 text-slate-400 group-hover:text-cyan-600 ${isLoading ? 'animate-spin text-cyan-600' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* --- Phase 1: Metric Cards --- */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Revenue"
                    value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
                    subValue="All active invoices"
                    trend={{ value: '12.5%', positive: true }}
                    icon={BanknotesIcon}
                    color="cyan"
                />
                <MetricCard
                    title="Total Bookings"
                    value={stats?.bookingCount || 0}
                    subValue="Confirmed stays"
                    trend={{ value: '5.2%', positive: true }}
                    icon={CalendarDaysIcon}
                    color="blue"
                />
                <MetricCard
                    title="Occupancy Rate"
                    value={`${stats?.occupancyRate || 0}%`}
                    subValue={`${occupancy.occupied} of ${occupancy.total} rooms`}
                    trend={{ value: '2.1%', positive: false }}
                    icon={HomeIcon}
                    color="emerald"
                />
                <MetricCard
                    title="Staff Actions"
                    value={stats?.auditLogTotal || 0}
                    subValue="Audit logs"
                    icon={ClipboardDocumentListIcon}
                    color="amber"
                />
            </div>

            {/* --- Phase 2: Charts Section --- */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Revenue Evolution */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-cyan-50 p-2">
                                <BanknotesIcon className="h-5 w-5 text-cyan-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Revenue Evolution</h3>
                                <p className="text-xs text-slate-500">Daily financial performance trend</p>
                            </div>
                        </div>
                        <div className="flex rounded-lg bg-slate-100 p-1">
                            <button className="rounded-md bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">Daily</button>
                            <button className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700">Monthly</button>
                        </div>
                    </div>

                    <div className="mt-8 h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueChartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Room Status Distribution */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-indigo-50 p-2">
                            <HomeIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Room Status</h3>
                            <p className="text-xs text-slate-500">Real-time inventory split</p>
                        </div>
                    </div>

                    <div className="mt-6 flex h-[250px] items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {statusChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" align="center" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                                <span className="text-sm font-medium text-slate-600">Available</span>
                            </div>
                            <span className="font-bold text-slate-900">{occupancy.available}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                <span className="text-sm font-medium text-slate-600">Occupied</span>
                            </div>
                            <span className="font-bold text-slate-900">{occupancy.occupied}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                <span className="text-sm font-medium text-slate-600">Maintenance</span>
                            </div>
                            <span className="font-bold text-slate-900">{occupancy.maintenance}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Phase 3: Bottom Section (Tables & Lists) --- */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Bookings */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-50 p-2">
                                <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Latest Bookings</h3>
                                <p className="text-xs text-slate-500">Recently confirmed reservations</p>
                            </div>
                        </div>
                        <button className="text-sm font-bold text-cyan-600 hover:text-cyan-700">View All</button>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <th className="pb-3 text-left">Ref</th>
                                    <th className="pb-3 text-left">Guest Name</th>
                                    <th className="pb-3 text-left">Dates</th>
                                    <th className="pb-3 text-left">Amount</th>
                                    <th className="pb-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentBookings.map((booking) => (
                                    <tr key={booking.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 font-mono font-bold text-slate-400">#{booking.id}</td>
                                        <td className="py-4 font-semibold text-slate-900">{booking.guestName}</td>
                                        <td className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-600">{new Date(booking.checkInDate).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-slate-400">Total: {Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 3600 * 24))} nights</span>
                                            </div>
                                        </td>
                                        <td className="py-4 font-bold text-slate-900">${booking.totalAmount.toLocaleString()}</td>
                                        <td className="py-4 text-right">
                                            <Badge value={booking.status} />
                                        </td>
                                    </tr>
                                ))}
                                {recentBookings.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 italic">No recent bookings found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Combined Alerts Column */}
                <div className="space-y-6">
                    {/* Alerts / Maintenance List */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm font-sans">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">Critical Alerts</h3>
                            <div className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                                {criticalAlerts.length} Issues
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            {criticalAlerts.map((loss) => (
                                <div key={loss.id} className="group flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-rose-200">
                                    <div className="rounded-lg bg-white p-2 text-rose-500 shadow-sm transition-colors group-hover:bg-rose-500 group-hover:text-white">
                                        <ExclamationTriangleIcon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="truncate text-sm font-bold text-slate-900">{loss.itemName}</p>
                                        <p className="truncate text-xs text-slate-500">Room {loss.room} • Penalty: ${loss.penalty}</p>
                                        <p className="mt-1 line-clamp-2 text-[10px] text-slate-400 italic">"{loss.description}"</p>
                                    </div>
                                </div>
                            ))}
                            {criticalAlerts.length === 0 && (
                                <div className="py-8 text-center text-sm text-slate-400">Everything looks good!</div>
                            )}
                        </div>
                    </div>

                    {/* Pending Services */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900">Service Queue</h3>
                        <div className="mt-6 space-y-4">
                            {pendingServices.map((order) => (
                                <a href={`/admin/reception/order-services/${order.id}`} key={order.id} className="block">
                                    <div key={order.id} className="flex items-center gap-4 rounded-xl border border-cyan-100 bg-cyan-50/30 p-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                                            <ClockIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <p className="text-sm font-bold text-slate-900">Order #{order.id}</p>
                                                <span className="text-[10px] font-bold text-cyan-600">{new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">Room {order.roomNumber} • {order.guestName}</p>
                                        </div>
                                        <button className="rounded-lg bg-white p-1 text-slate-400 hover:text-cyan-600 shadow-sm border border-slate-100">
                                            <ChevronRightIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </a>
                            ))}
                            {pendingServices.length === 0 && (
                                <div className="py-8 text-center text-sm text-slate-400">No pending services.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
