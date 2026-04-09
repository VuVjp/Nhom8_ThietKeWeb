import { useCallback, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Table } from '../../../components/Table';
import { Pagination } from '../../../components/Pagination';
import { toApiError } from '../../../api/httpClient';
import { receptionApi } from '../../../api/receptionApi';
import type { Booking } from '../../../types/models';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../../utils/format';

export function ArrivalsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const loadArrivals = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await receptionApi.getArrivalsToday();
            setBookings(data || []);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load arrivals');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadArrivals();
    }, [loadArrivals]);

    const handleCheckIn = async (id: number) => {
        try {
            await receptionApi.changeBookingStatus(id, 'CheckedIn');
            toast.success('Guest checked in successfully');
            void loadArrivals();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to check-in');
        }
    };

    const paginatedBookings = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return bookings.slice(start, start + pageSize);
    }, [bookings, currentPage, pageSize]);

    const columns = [
        { key: 'guestName', label: 'Guest Name', render: (row: Booking) => row.guestName },
        { key: 'guestPhone', label: 'Phone', render: (row: Booking) => row.guestPhone },
        { key: 'dates', label: 'Dates', render: (row: Booking) => `${formatDate(row.checkInDate)} - ${formatDate(row.checkOutDate)}` },
        { key: 'roomIds', label: 'Rooms', render: (row: Booking) => row.roomIds?.join(', ') || 'Unassigned' },
        {
            key: 'status', label: 'Status', render: (row: Booking) => (
                <span className="rounded bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-800">{row.status}</span>
            )
        },
        {
            key: 'actions', label: 'Actions', render: (row: Booking) => (
                row.status === 'Confirmed' || row.status === 'Pending' ? (
                    <button type="button" className="inline-flex items-center gap-1 rounded border border-cyan-600 px-2 py-1 text-xs text-cyan-700 hover:bg-cyan-50" onClick={() => handleCheckIn(row.id)}>
                        <CheckCircleIcon className="h-4 w-4" /> Check In
                    </button>
                ) : null
            )
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Arrivals Today</h2>
                    <p className="text-sm text-slate-500">Guests expected to check-in today.</p>
                </div>
                <button
                    onClick={() => void loadArrivals()}
                    className="p-2 text-slate-500 hover:text-cyan-600 transition bg-white border border-slate-200 rounded-xl"
                    title="Refresh"
                >
                    <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {isLoading ? (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
                    <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-bold text-slate-600 animate-pulse">Loading arrivals...</p>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-4">
                    {bookings.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">No arrivals today.</div>
                    ) : (
                        <>
                            <Table columns={columns} rows={paginatedBookings} />
                            <Pagination
                                page={currentPage}
                                pageSize={pageSize}
                                total={bookings.length}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
