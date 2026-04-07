import { useCallback, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Table } from '../../../components/Table';
import { Pagination } from '../../../components/Pagination';
import { toApiError } from '../../../api/httpClient';
import { receptionApi } from '../../../api/receptionApi';
import type { Booking } from '../../../types/models';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export function InHousePage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

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

    const paginatedBookings = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return bookings.slice(start, start + pageSize);
    }, [bookings, currentPage, pageSize]);

    const columns = [
        { key: 'guestName', label: 'Guest Name', render: (row: Booking) => row.guestName },
        { key: 'guestPhone', label: 'Phone', render: (row: Booking) => row.guestPhone },
        { key: 'roomIds', label: 'Rooms', render: (row: Booking) => row.roomIds?.join(', ') || 'Unassigned' },
        { key: 'status', label: 'Status', render: (row: Booking) => (
            <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">{row.status}</span>
        ) },
        { key: 'actions', label: 'Actions', render: (row: Booking) => (
            <button type="button" className="inline-flex items-center gap-1 rounded border border-orange-600 px-2 py-1 text-xs text-orange-700 hover:bg-orange-50" onClick={() => handleCheckOut(row.id)}>
                <ArrowRightOnRectangleIcon className="h-4 w-4" /> Check Out
            </button>
        ) },
    ];

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">In-House Guests</h2>
                <p className="text-sm text-slate-500">Currently staying at the hotel.</p>
            </div>

            {isLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading guests...</div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-4">
                    {bookings.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">No in-house guests currently.</div>
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
