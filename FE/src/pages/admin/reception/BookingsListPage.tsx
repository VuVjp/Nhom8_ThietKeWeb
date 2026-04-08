import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Table } from '../../../components/Table';
import { Select } from '../../../components/Select';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { Pagination } from '../../../components/Pagination';
import { toApiError } from '../../../api/httpClient';
import { receptionApi } from '../../../api/receptionApi';
import type { Booking, BookingStatus, RoomAvailability } from '../../../types/models';
import { PencilSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../../utils/format';

export function BookingsListPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchName, setSearchName] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | BookingStatus>('All');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minRooms, setMinRooms] = useState('');
    const [maxRooms, setMaxRooms] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [editing, setEditing] = useState<Booking | null>(null);
    const [editGuestName, setEditGuestName] = useState('');
    const [editGuestPhone, setEditGuestPhone] = useState('');
    const [editGuestEmail, setEditGuestEmail] = useState('');
    const [editCheckInDate, setEditCheckInDate] = useState('');
    const [editCheckOutDate, setEditCheckOutDate] = useState('');
    const [editSelectedRoomIds, setEditSelectedRoomIds] = useState<number[]>([]);
    const [editAvailableRooms, setEditAvailableRooms] = useState<RoomAvailability[]>([]);
    const [isLoadingEditRooms, setIsLoadingEditRooms] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const loadBookings = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await receptionApi.getAllBookings();
            setBookings(data || []);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load bookings');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadBookings();
    }, [loadBookings]);

    const handleStatusChange = async (id: number, status: BookingStatus) => {
        try {
            await receptionApi.changeBookingStatus(id, status);
            toast.success('Status updated successfully');
            void loadBookings();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to update status');
        }
    };

    const loadEditAvailableRooms = useCallback(async (checkIn: string, checkOut: string, bookingId: number) => {
        if (!checkIn || !checkOut) {
            setEditAvailableRooms([]);
            return;
        }

        setIsLoadingEditRooms(true);
        try {
            const rooms = await receptionApi.getAvailableRooms(checkIn, checkOut, bookingId);
            setEditAvailableRooms(rooms || []);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load available rooms');
            setEditAvailableRooms([]);
        } finally {
            setIsLoadingEditRooms(false);
        }
    }, []);

    const openEditModal = (booking: Booking) => {
        setEditing(booking);
        setEditGuestName(booking.guestName ?? '');
        setEditGuestPhone(booking.guestPhone ?? '');
        setEditGuestEmail(booking.guestEmail ?? '');
        setEditCheckInDate(booking.checkInDate?.slice(0, 16) ?? '');
        setEditCheckOutDate(booking.checkOutDate?.slice(0, 16) ?? '');
        setEditSelectedRoomIds(booking.roomIds ?? []);
        void loadEditAvailableRooms(booking.checkInDate, booking.checkOutDate, booking.id);
    };

    const closeEditModal = () => {
        setEditing(null);
        setEditGuestName('');
        setEditGuestPhone('');
        setEditGuestEmail('');
        setEditCheckInDate('');
        setEditCheckOutDate('');
        setEditSelectedRoomIds([]);
        setEditAvailableRooms([]);
    };

    const toggleEditRoom = (roomId: number) => {
        setEditSelectedRoomIds((prev) =>
            prev.includes(roomId)
                ? prev.filter((id) => id !== roomId)
                : [...prev, roomId],
        );
    };

    useEffect(() => {
        if (!editing) {
            return;
        }

        if (!editCheckInDate || !editCheckOutDate) {
            return;
        }

        if (new Date(editCheckOutDate) <= new Date(editCheckInDate)) {
            return;
        }

        const timer = setTimeout(() => {
            void loadEditAvailableRooms(editCheckInDate, editCheckOutDate, editing.id);
        }, 300);

        return () => clearTimeout(timer);
    }, [editing, editCheckInDate, editCheckOutDate, loadEditAvailableRooms]);

    const saveEdit = async () => {
        if (!editing) {
            return;
        }

        if (editing.status !== 'Pending') {
            toast.error('Only pending bookings can be edited');
            return;
        }

        if (!editGuestName.trim() || !editGuestPhone.trim()) {
            toast.error('Guest name and phone are required');
            return;
        }

        if (!editCheckInDate || !editCheckOutDate) {
            toast.error('Check-in and check-out are required');
            return;
        }

        if (new Date(editCheckOutDate) <= new Date(editCheckInDate)) {
            toast.error('Check-out must be after check-in');
            return;
        }

        if (editSelectedRoomIds.length === 0) {
            toast.error('Please select at least one room');
            return;
        }

        setIsSavingEdit(true);
        try {
            await receptionApi.updateBooking(editing.id, {
                guestName: editGuestName.trim(),
                guestPhone: editGuestPhone.trim(),
                guestEmail: editGuestEmail.trim() || undefined,
                checkInDate: editCheckInDate,
                checkOutDate: editCheckOutDate,
                roomIds: editSelectedRoomIds,
            });

            toast.success('Booking updated successfully');
            closeEditModal();
            await loadBookings();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to update booking');
        } finally {
            setIsSavingEdit(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchName, statusFilter, minPrice, maxPrice, minRooms, maxRooms]);

    const filteredBookings = useMemo(() => {
        const minPriceValue = minPrice === '' ? null : Number(minPrice);
        const maxPriceValue = maxPrice === '' ? null : Number(maxPrice);
        const minRoomsValue = minRooms === '' ? null : Number(minRooms);
        const maxRoomsValue = maxRooms === '' ? null : Number(maxRooms);

        return bookings.filter((booking) => {
            const nameMatches =
                !searchName.trim() ||
                booking.guestName.toLowerCase().includes(searchName.trim().toLowerCase());

            const statusMatches = statusFilter === 'All' || booking.status === statusFilter;

            const bookingPrice = Number(booking.totalAmount ?? 0);
            const priceMinMatches = minPriceValue === null || bookingPrice >= minPriceValue;
            const priceMaxMatches = maxPriceValue === null || bookingPrice <= maxPriceValue;

            const roomCount = booking.roomIds?.length ?? 0;
            const roomsMinMatches = minRoomsValue === null || roomCount >= minRoomsValue;
            const roomsMaxMatches = maxRoomsValue === null || roomCount <= maxRoomsValue;

            return (
                nameMatches &&
                statusMatches &&
                priceMinMatches &&
                priceMaxMatches &&
                roomsMinMatches &&
                roomsMaxMatches
            );
        });
    }, [bookings, searchName, statusFilter, minPrice, maxPrice, minRooms, maxRooms]);

    const paginatedBookings = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredBookings.slice(start, start + pageSize);
    }, [filteredBookings, currentPage, pageSize]);

    const columns = [
        { key: 'id', label: 'Booking ID', render: (row: Booking) => `#${row.id}` },
        { key: 'guestName', label: 'Guest Name', render: (row: Booking) => row.guestName },
        { key: 'guestPhone', label: 'Phone', render: (row: Booking) => row.guestPhone || '-' },
        { key: 'guestEmail', label: 'Email', render: (row: Booking) => row.guestEmail || '-' },
        {
            key: 'dates',
            label: 'Dates',
            render: (row: Booking) => {
                return formatDate(row.checkInDate) + ' - ' + formatDate(row.checkOutDate);
            }
        },
        {
            key: 'roomIds',
            label: 'Room Details',
            render: (row: Booking) => (
                <div className="text-xs leading-5">
                    <div><span className="font-medium text-slate-800">IDs:</span> {row.roomIds?.join(', ') || 'Unassigned'}</div>
                    <div><span className="font-medium text-slate-800">Count:</span> {row.roomIds?.length ?? 0}</div>
                </div>
            ),
        },
        { key: 'totalAmount', label: 'Total', render: (row: Booking) => `$${row.totalAmount?.toLocaleString()}` },
        {
            key: 'status',
            label: 'Status',
            render: (row: Booking) => (
                <Select
                    value={row.status}
                    style={{ minWidth: '120px' }}
                    onChange={(e) => handleStatusChange(row.id, e.target.value as BookingStatus)}
                    className="w-32"
                >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="CheckedIn">Checked In</option>
                    <option value="CheckedOut">Checked Out</option>
                    <option value="Cancelled">Cancelled</option>
                </Select>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: Booking) =>
                row.status === 'Pending' ? (
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        onClick={() => openEditModal(row)}
                    >
                        <PencilSquareIcon className="h-4 w-4" /> Edit
                    </button>
                ) : (
                    <span className="text-xs text-slate-400">Locked</span>
                ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">All Bookings</h2>
                    <p className="text-sm text-slate-500">History and active reservations.</p>
                </div>
                <button
                    onClick={() => void loadBookings()}
                    className="p-2 text-slate-500 hover:text-cyan-600 transition bg-white border border-slate-200 rounded-xl"
                    title="Refresh"
                >
                    <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-3">
                <Input
                    placeholder="Filter by guest name"
                    value={searchName}
                    onChange={(event) => setSearchName(event.target.value)}
                />
                <Select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'All' | BookingStatus)}
                >
                    <option value="All">All statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="CheckedIn">Checked In</option>
                    <option value="CheckedOut">Checked Out</option>
                    <option value="Cancelled">Cancelled</option>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                    <Input
                        type="number"
                        min={0}
                        placeholder="Min price"
                        value={minPrice}
                        onChange={(event) => setMinPrice(event.target.value)}
                    />
                    <Input
                        type="number"
                        min={0}
                        placeholder="Max price"
                        value={maxPrice}
                        onChange={(event) => setMaxPrice(event.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Input
                        type="number"
                        min={0}
                        placeholder="Min rooms"
                        value={minRooms}
                        onChange={(event) => setMinRooms(event.target.value)}
                    />
                    <Input
                        type="number"
                        min={0}
                        placeholder="Max rooms"
                        value={maxRooms}
                        onChange={(event) => setMaxRooms(event.target.value)}
                    />
                </div>
                <div className="md:col-span-2 xl:col-span-3">
                    <p className="text-xs text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{filteredBookings.length}</span> / {bookings.length} bookings
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading bookings...</div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-4">
                    {filteredBookings.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">No bookings found.</div>
                    ) : (
                        <>
                            <Table columns={columns} rows={paginatedBookings} />
                            <Pagination
                                page={currentPage}
                                pageSize={pageSize}
                                total={filteredBookings.length}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            )}

            <Modal open={Boolean(editing)} title={editing ? `Edit Booking #${editing.id}` : 'Edit Booking'} onClose={closeEditModal}>
                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                        Only bookings in Pending status can be edited.
                    </div>

                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-semibold text-slate-900">Guest details</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Guest name</label>
                                <Input value={editGuestName} onChange={(event) => setEditGuestName(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Phone</label>
                                <Input value={editGuestPhone} onChange={(event) => setEditGuestPhone(event.target.value)} />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Email</label>
                                <Input type="email" value={editGuestEmail} onChange={(event) => setEditGuestEmail(event.target.value)} />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-semibold text-slate-900">Booking details</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Check-in</label>
                                <Input type="datetime-local" value={editCheckInDate} onChange={(event) => setEditCheckInDate(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Check-out</label>
                                <Input type="datetime-local" value={editCheckOutDate} onChange={(event) => setEditCheckOutDate(event.target.value)} />
                            </div>
                            <div className="space-y-2 sm:col-span-2">

                                <label className="text-sm font-medium text-slate-700">Available rooms</label>
                                {isLoadingEditRooms ? (
                                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500">Loading rooms...</div>
                                ) : editAvailableRooms.length === 0 ? (
                                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500">No available rooms for selected time.</div>
                                ) : (
                                    <div className="grid gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto">
                                        {editAvailableRooms.map((room) => {
                                            const isSelected = editSelectedRoomIds.includes(room.roomId);
                                            return (
                                                <button
                                                    key={room.roomId}
                                                    type="button"
                                                    className={`rounded-lg border p-3 text-left text-sm transition ${isSelected ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-cyan-300'}`}
                                                    onClick={() => toggleEditRoom(room.roomId)}
                                                >
                                                    <div className="font-semibold text-slate-900">Room {room.roomNumber}</div>
                                                    <div className="text-xs text-slate-500">{room.roomTypeName}</div>
                                                    <div className="mt-1 text-xs font-medium text-cyan-700">${room.pricePerNight} / night</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                <p className="text-xs text-slate-500">Selected: {editSelectedRoomIds.length} room(s)</p>
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-2">
                        <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={closeEditModal}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            onClick={() => void saveEdit()}
                            disabled={isSavingEdit}
                        >
                            {isSavingEdit ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
