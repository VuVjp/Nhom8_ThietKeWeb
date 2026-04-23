import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Table } from '../../../components/Table';
import { Select } from '../../../components/Select';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { Pagination } from '../../../components/Pagination';
import { toApiError } from '../../../api/httpClient';
import { receptionApi } from '../../../api/receptionApi';
import momoApi from '../../../api/momoApi';
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
    const [filterRoomNumber, setFilterRoomNumber] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

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
    const [isLoadingEditRooms] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [activePaymentBookingId, setActivePaymentBookingId] = useState<number | null>(null);
    const [activePaymentMethod, setActivePaymentMethod] = useState<'cash' | 'momo' | null>(null);
    const [viewRoomsTarget, setViewRoomsTarget] = useState<Booking | null>(null);
    const [cashPaymentTarget, setCashPaymentTarget] = useState<Booking | null>(null);

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
            setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));

        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to update status');
        }
    };

    const handleBookingCashPayment = async (booking: Booking) => {
        if (booking.status !== 'Pending') {
            toast.error('Only pending bookings can receive deposit payment.');
            return;
        }

        setActivePaymentBookingId(booking.id);
        setActivePaymentMethod('cash');
        try {
            await momoApi.payCash({
                type: 'booking',
                targetId: booking.id,
            });
            toast.success('Cash deposit recorded. Booking confirmed.');
            setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: 'Confirmed' } : b)));
            setCashPaymentTarget(null);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to process cash payment');
        } finally {
            setActivePaymentBookingId(null);
            setActivePaymentMethod(null);
        }
    };

    const handleBookingMomoPayment = async (booking: Booking) => {
        if (booking.status !== 'Pending') {
            toast.error('Only pending bookings can receive deposit payment.');
            return;
        }

        setActivePaymentBookingId(booking.id);
        setActivePaymentMethod('momo');
        try {
            const response = await momoApi.createPayment({
                type: 'booking',
                targetId: booking.id,
            });

            if (!response.payUrl) {
                toast.error('Unable to create MoMo payment link.');
                return;
            }

            window.open(response.payUrl, '_blank', 'noopener,noreferrer');
            toast.success('Opened MoMo payment page in a new tab.');
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to create MoMo payment');
        } finally {
            setActivePaymentBookingId(null);
            setActivePaymentMethod(null);
        }
    };

    const loadEditAvailableRooms = useCallback(async (checkIn: string, checkOut: string, bookingId: number) => {
        if (!checkIn || !checkOut) {
            setEditAvailableRooms([]);
            return;
        }

        //setIsLoadingEditRooms(true);
        try {
            const rooms = await receptionApi.getAvailableRooms(checkIn, checkOut, bookingId);
            setEditAvailableRooms(rooms || []);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load available rooms');
            setEditAvailableRooms([]);
        } finally {
            //setIsLoadingEditRooms(false);
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
    }, [searchName, statusFilter, minPrice, maxPrice, minRooms, maxRooms, filterStartDate, filterEndDate, filterRoomNumber]);

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

            const roomCount = booking.roomNumbers?.length ?? 0;
            const roomsMinMatches = minRoomsValue === null || roomCount >= minRoomsValue;
            const roomsMaxMatches = maxRoomsValue === null || roomCount <= maxRoomsValue;

            const roomNumberMatches =
                !filterRoomNumber.trim() ||
                booking.roomNumbers?.some((rn) =>
                    rn.toLowerCase().includes(filterRoomNumber.trim().toLowerCase())
                );

            const dateMatches = (() => {
                if (!filterStartDate && !filterEndDate) return true;

                const bookingStart = new Date(booking.checkInDate).setHours(0, 0, 0, 0);
                const bookingEnd = new Date(booking.checkOutDate).setHours(23, 59, 59, 999);

                const filterStart = filterStartDate
                    ? new Date(filterStartDate).setHours(0, 0, 0, 0)
                    : -Infinity;
                const filterEnd = filterEndDate
                    ? new Date(filterEndDate).setHours(23, 59, 59, 999)
                    : Infinity;

                return bookingStart <= filterEnd && bookingEnd >= filterStart;
            })();

            return (
                nameMatches &&
                statusMatches &&
                priceMinMatches &&
                priceMaxMatches &&
                roomsMinMatches &&
                roomsMaxMatches &&
                roomNumberMatches &&
                dateMatches
            );
        });
    }, [bookings, searchName, statusFilter, minPrice, maxPrice, minRooms, maxRooms, filterStartDate, filterEndDate, filterRoomNumber]);

    const paginatedBookings = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredBookings.slice(start, start + pageSize);
    }, [filteredBookings, currentPage, pageSize]);


    const columns = [
        { key: 'id', label: 'ID', render: (row: Booking) => <span className="font-medium text-slate-900">#{row.id}</span> },
        { 
            key: 'guestInfo', 
            label: 'Guest Info', 
            render: (row: Booking) => (
                <div>
                    <div className="font-semibold text-slate-900">{row.guestName}</div>
                    <div className="text-xs text-slate-500">{row.guestPhone || 'No phone'} &bull; {row.guestEmail || 'No email'}</div>
                </div>
            )
        },
        {
            key: 'dates',
            label: 'Stay',
            render: (row: Booking) => (
                <div>
                    <div className="text-sm text-slate-900">{formatDate(row.checkInDate)}</div>
                    <div className="text-xs text-slate-500">to {formatDate(row.checkOutDate)}</div>
                </div>
            )
        },
        {
            key: 'roomDetails',
            label: 'Rooms',
            render: (row: Booking) => {
                const count = row.roomNumbers?.length ?? 0;
                const visible = row.roomNumbers?.slice(0, 4) ?? [];
                const extra = count > 4 ? count - 4 : 0;

                return (
                    <div 
                        className="cursor-pointer group"
                        onClick={() => setViewRoomsTarget(row)}
                    >
                        <div className="flex flex-wrap gap-1">
                            {visible.map((rn) => (
                                <span key={rn} className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200 group-hover:bg-cyan-50 group-hover:text-cyan-700 group-hover:ring-cyan-200">
                                    {rn}
                                </span>
                            ))}
                            {extra > 0 && (
                                <span className="inline-flex items-center rounded-md bg-cyan-100 px-1.5 py-0.5 text-xs font-medium text-cyan-700 ring-1 ring-inset ring-cyan-200">
                                    +{extra}
                                </span>
                            )}
                            {count === 0 && <span className="text-slate-400 italic text-xs">Unassigned</span>}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold group-hover:text-cyan-600 transition-colors">
                            {count} room{count !== 1 ? 's' : ''} &bull; Click to view
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'discounts',
            label: 'Discounts',
            render: (row: Booking) => (
                <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-slate-500">Member:</span>
                        <span className="font-medium text-amber-600">-${row.membershipDiscount?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-slate-500">Voucher:</span>
                        <span className="font-medium text-blue-600">-${row.voucherDiscount?.toLocaleString()}</span>
                    </div>
                </div>
            )
        },
        { 
            key: 'finances', 
            label: 'Finances', 
            render: (row: Booking) => (
                <div className="text-right">
                    <div className="font-semibold text-emerald-600">${row.totalAmount?.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Dep: ${row.deposit?.toLocaleString()}</div>
                </div>
            )
        },
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
            render: (row: Booking) => {
                const isPending = row.status === 'Pending';
                return (
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => openEditModal(row)}
                            disabled={!isPending}
                        >
                            <PencilSquareIcon className="h-4 w-4" /> Edit
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            onClick={() => setCashPaymentTarget(row)}
                            disabled={!isPending || activePaymentBookingId === row.id}
                        >
                            {activePaymentBookingId === row.id && activePaymentMethod === 'cash' ? 'Processing...' : 'Cash Deposit'}
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center rounded-lg bg-cyan-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-cyan-800 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            onClick={() => void handleBookingMomoPayment(row)}
                            disabled={!isPending || activePaymentBookingId === row.id}
                        >
                            {activePaymentBookingId === row.id && activePaymentMethod === 'momo' ? 'Creating link...' : 'MoMo Transfer'}
                        </button>
                    </div>
                );
            },
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
                <div className="grid grid-cols-2 gap-2">
                    <Input
                        type="date"
                        value={filterStartDate}
                        onChange={(event) => setFilterStartDate(event.target.value)}
                        title="From date"
                    />
                    <Input
                        type="date"
                        value={filterEndDate}
                        onChange={(event) => setFilterEndDate(event.target.value)}
                        title="To date"
                    />
                </div>
                <Input
                    placeholder="Filter by room number"
                    value={filterRoomNumber}
                    onChange={(event) => setFilterRoomNumber(event.target.value)}
                />
                <div className="md:col-span-2 xl:col-span-3">
                    <p className="text-xs text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{filteredBookings.length}</span> / {bookings.length} bookings
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
                    <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-bold text-slate-600 animate-pulse">Loading bookings...</p>
                </div>) : (
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

                                <label className="text-sm min-w-30 font-medium text-slate-700">Available rooms</label>
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

            <Modal
                open={Boolean(viewRoomsTarget)}
                title={`Rooms for Booking #${viewRoomsTarget?.id}`}
                onClose={() => setViewRoomsTarget(null)}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {viewRoomsTarget?.roomNumbers?.map((rn) => (
                            <div 
                                key={rn} 
                                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-cyan-300 hover:shadow-md"
                            >
                                <span className="text-2xl font-bold text-slate-900">{rn}</span>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Room</span>
                            </div>
                        ))}
                    </div>
                    {(!viewRoomsTarget?.roomNumbers || viewRoomsTarget.roomNumbers.length === 0) && (
                        <div className="text-center py-8 text-slate-500">No rooms assigned to this booking.</div>
                    )}
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                            onClick={() => setViewRoomsTarget(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={Boolean(cashPaymentTarget)}
                title="Confirm Cash Deposit"
                onClose={() => setCashPaymentTarget(null)}
            >
                {cashPaymentTarget && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                            <h3 className="font-semibold text-emerald-900 mb-2">Deposit Summary</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-emerald-700">Booking ID</span>
                                    <span className="font-medium text-emerald-950">#{cashPaymentTarget.id}</span>
                                </div>
                                <div>
                                    <span className="block text-emerald-700">Guest</span>
                                    <span className="font-medium text-emerald-950">{cashPaymentTarget.guestName}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="block text-emerald-700">Rooms ({cashPaymentTarget.roomNumbers?.length || 0})</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {cashPaymentTarget.roomNumbers?.map(rn => (
                                            <span key={rn} className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-semibold text-emerald-800 shadow-sm ring-1 ring-inset ring-emerald-200">
                                                {rn}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2 mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                                    <span className="font-semibold text-emerald-800">Amount to Receive:</span>
                                    <span className="text-xl font-bold text-emerald-600">${cashPaymentTarget.deposit?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                onClick={() => setCashPaymentTarget(null)}
                                disabled={activePaymentBookingId === cashPaymentTarget.id}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                onClick={() => void handleBookingCashPayment(cashPaymentTarget)}
                                disabled={activePaymentBookingId === cashPaymentTarget.id}
                            >
                                {activePaymentBookingId === cashPaymentTarget.id ? (
                                    <>
                                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                        Processing...
                                    </>
                                ) : 'Confirm & Collect Cash'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
