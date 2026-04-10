import { useCallback, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Table } from '../../../components/Table';
import { toApiError } from '../../../api/httpClient';
import { receptionApi } from '../../../api/receptionApi';
import type { Booking } from '../../../types/models';
import { ArrowPathIcon, ArrowRightEndOnRectangleIcon, ClockIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../../utils/format';

export function InHousePage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadInHouse = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await receptionApi.getInHouseGuests();
            setBookings(data || []);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load in-house guests');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadInHouse();
    }, [loadInHouse]);

    const handleCheckOut = async (id: number) => {
        try {
            await receptionApi.changeBookingStatus(id, 'CheckedOut');
            toast.success('Guest checked out successfully');
            void loadInHouse();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to check-out');
        }
    };

    const categories = useMemo(() => {
        const now = new Date();
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        return {
            overdue: bookings.filter(b => new Date(b.checkOutDate) < now),
            endingToday: bookings.filter(b => {
                const checkout = new Date(b.checkOutDate);
                return checkout >= now && checkout <= todayEnd;
            }),
            staying: bookings.filter(b => new Date(b.checkOutDate) > todayEnd),
        };
    }, [bookings]);

    const columns = [
        { 
            key: 'guestName', 
            label: 'Guest Name', 
            render: (row: Booking) => (
                <div className="font-medium text-slate-900">{row.guestName}</div>
            ) 
        },
        { key: 'guestPhone', label: 'Phone', render: (row: Booking) => row.guestPhone },
        { 
            key: 'roomNumbers', 
            label: 'Rooms', 
            render: (row: Booking) => (
                <div className="flex flex-wrap gap-1">
                    {row.roomNumbers?.map(num => (
                        <span key={num} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium border border-slate-200">
                            {num}
                        </span>
                    )) || 'Unassigned'}
                </div>
            )
        },
        { 
            key: 'dates', 
            label: 'Dates', 
            render: (row: Booking) => (
                <div className="text-xs">
                    <div className="text-slate-500">In: {formatDate(row.checkInDate)}</div>
                    <div className="text-slate-800 font-medium">Out: {formatDate(row.checkOutDate)}</div>
                </div>
            )
        },
        {
            key: 'actions', label: 'Actions', render: (row: Booking) => (
                <button 
                    type="button" 
                    className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors" 
                    onClick={() => handleCheckOut(row.id)}
                >
                    <ArrowRightEndOnRectangleIcon className="h-4 w-4" /> Check Out
                </button>
            )
        },
    ];

    const TableSection = ({ title, description, icon: Icon, data, colorClass, emptyMessage }: any) => (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass.bg}`}>
                        <Icon className={`h-5 w-5 ${colorClass.text}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            {title}
                            <span className={`px-2 py-0.5 rounded-full text-xs ${colorClass.badge}`}>
                                {data.length}
                            </span>
                        </h3>
                        <p className="text-sm text-slate-500">{description}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {data.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 text-sm italic">
                        {emptyMessage}
                    </div>
                ) : (
                    <Table columns={columns} rows={data} />
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">In-House Guests</h2>
                    <p className="text-sm text-slate-500">Currently staying at the hotel grouped by checkout urgency.</p>
                </div>
                <button
                    onClick={() => void loadInHouse()}
                    className="p-2 text-slate-500 hover:text-cyan-600 transition bg-white border border-slate-200 rounded-xl shadow-sm"
                    title="Refresh"
                >
                    <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-bold text-slate-600 animate-pulse">Updating guest dashboard...</p>
                </div>
            ) : (
                <>
                    <TableSection 
                        title="Overdue Check-outs" 
                        description="Guests who have exceeded their scheduled check-out time."
                        icon={ExclamationTriangleIcon}
                        data={categories.overdue}
                        colorClass={{
                            bg: 'bg-rose-50',
                            text: 'text-rose-600',
                            badge: 'bg-rose-100 text-rose-700 font-bold'
                        }}
                        emptyMessage="No guest stays are currently overdue."
                    />

                    <TableSection 
                        title="Ending Today" 
                        description="Guests scheduled to check-out within the next few hours."
                        icon={ClockIcon}
                        data={categories.endingToday}
                        colorClass={{
                            bg: 'bg-amber-50',
                            text: 'text-amber-600',
                            badge: 'bg-amber-100 text-amber-700 font-bold'
                        }}
                        emptyMessage="No guests are scheduled to depart today."
                    />

                    <TableSection 
                        title="Active Stay" 
                        description="Guests currently in-house with future check-out dates."
                        icon={CalendarIcon}
                        data={categories.staying}
                        colorClass={{
                            bg: 'bg-emerald-50',
                            text: 'text-emerald-600',
                            badge: 'bg-emerald-100 text-emerald-700 font-bold'
                        }}
                        emptyMessage="No other in-house guests currently."
                    />
                </>
            )}
        </div>
    );
}
