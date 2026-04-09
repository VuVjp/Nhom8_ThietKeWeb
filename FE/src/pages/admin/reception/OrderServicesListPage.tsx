import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EyeIcon, ArrowPathIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { orderServicesApi } from '../../../api/orderServicesApi';
import { receptionApi } from '../../../api/receptionApi';
import type { OrderService } from '../../../types/models';
import { toApiError } from '../../../api/httpClient';
import { Table } from '../../../components/Table';
import { Modal } from '../../../components/Modal';
import { Select } from '../../../components/Select';
import { Input } from '../../../components/Input';

export function OrderServicesListPage() {
    const navigate = useNavigate();
    const [rows, setRows] = useState<OrderService[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState<string>('');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [openCreate, setOpenCreate] = useState(false);
    const [activeRooms, setActiveRooms] = useState<any[]>([]);
    const [selectedDetailId, setSelectedDetailId] = useState<number | undefined>(undefined);
    const [isCreating, setIsCreating] = useState(false);

    const loadOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await orderServicesApi.getPaged({
                search: search || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                status: status || undefined,
                sortBy,
                sortOrder,
                page,
                pageSize: 10
            });
            setRows(data.items);
            setTotal(data.total);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load order services');
        } finally {
            setIsLoading(false);
        }
    }, [search, startDate, endDate, status, page, sortBy, sortOrder]);

    const loadActiveRooms = useCallback(async () => {
        try {
            const data = await receptionApi.getActiveRooms();
            setActiveRooms(data);
        } catch (error) {
            console.error('Failed to load active rooms', error);
        }
    }, []);

    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);

    useEffect(() => {
        if (openCreate) {
            void loadActiveRooms();
        }
    }, [openCreate, loadActiveRooms]);

    const handleCreateOrder = async () => {
        if (!selectedDetailId) {
            toast.error('Please select a room');
            return;
        }

        setIsCreating(true);
        try {
            const result = await orderServicesApi.create({ bookingDetailId: selectedDetailId });
            toast.success('Order created');
            navigate(`/admin/reception/order-services/${result.id}`);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to create order');
        } finally {
            setIsCreating(false);
        }
    };

    const getStatusColor = (status: any) => {
        const s = status?.toString();
        switch (s) {
            case 'Completed':
            case '1': 
                return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            case 'Cancelled':
            case '2':
                return 'text-red-700 bg-red-50 border-red-200';
            default: // Pending / 0
                return 'text-amber-700 bg-amber-50 border-amber-200';
        }
    };

    const columns = [
        { key: 'id', label: 'Order ID', render: (row: OrderService) => `#${row.id}` },
        { 
            key: 'room', 
            label: 'Room', 
            render: (row: OrderService) => (
                <div className="font-medium text-slate-900">
                    Room {row.roomNumber || '-'}
                </div>
            ) 
        },
        { 
            key: 'guest', 
            label: 'Guest', 
            render: (row: OrderService) => row.guestName || '-' 
        },
        { 
            key: 'date', 
            label: 'Order Date', 
            render: (row: OrderService) => new Date(row.orderDate).toLocaleString() 
        },
        { 
            key: 'amount', 
            label: 'Total Amount', 
            render: (row: OrderService) => (
                <span className="font-bold text-slate-900">${row.totalAmount.toLocaleString()}</span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: OrderService) => {
                const s = row.status.toString();
                const displayStatus = isNaN(Number(s)) 
                    ? s 
                    : (s === '1' ? 'Completed' : (s === '2' ? 'Cancelled' : 'Pending'));

                return (
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(s)}`}>
                        {displayStatus}
                    </div>
                );
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: OrderService) => (
                <button
                    onClick={() => navigate(`/admin/reception/order-services/${row.id}`)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50 transition"
                >
                    <EyeIcon className="h-4 w-4" /> View Detail
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Service Orders</h1>
                    <p className="text-slate-500 text-sm">Manage guest service requests and orders</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => void loadOrders()} 
                        className="p-2 border rounded-xl hover:bg-slate-50 transition bg-white shadow-sm"
                        title="Refresh"
                    >
                        <ArrowPathIcon className={`h-5 w-5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={() => setOpenCreate(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-700 text-white hover:bg-cyan-800 transition shadow-sm font-semibold text-sm"
                    >
                        <PlusIcon className="h-4 w-4" /> New Order
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                    <div className="lg:col-span-3 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Search</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                className="pl-9" 
                                placeholder="ID, Room, Guest..." 
                                value={search} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }} 
                            />
                        </div>
                    </div>
                    <div className="lg:col-span-5 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date Range</label>
                        <div className="flex gap-2">
                            <Input 
                                type="date" 
                                className="min-w-0 flex-1"
                                value={startDate} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }} 
                            />
                            <Input 
                                type="date"
                                className="min-w-0 flex-1"
                                value={endDate} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setEndDate(e.target.value);
                                    setPage(1);
                                }} 
                            />
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-1.5 min-w-0">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
                        <select 
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none appearance-none truncate"
                            value={status}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="lg:col-span-2 space-y-1.5 min-w-0">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Sort By</label>
                        <select 
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none appearance-none truncate"
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const [s, o] = e.target.value.split('-');
                                setSortBy(s);
                                setSortOrder(o as any);
                                setPage(1);
                            }}
                        >
                            <option value="date-desc">Newest First</option>
                            <option value="date-asc">Oldest First</option>
                            <option value="amount-desc">Total: High to Low</option>
                            <option value="amount-asc">Total: Low to High</option>
                            <option value="id-desc">Order ID: Max to Min</option>
                            <option value="id-asc">Order ID: Min to Max</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md relative">
                <Table 
                    columns={columns} 
                    rows={rows} 
                />

                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
                        <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-sm font-bold text-slate-600 animate-pulse">Loading orders...</p>
                    </div>
                )}

                {!isLoading && rows.length === 0 && (
                    <div className="p-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                            <MagnifyingGlassIcon className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
                    </div>
                )}
                
                {/* Pagination */}
                {total > 0 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <p className="text-xs text-slate-500 font-medium">
                            Page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{Math.ceil(total / 10)}</span>
                        </p>
                        <div className="flex gap-2">
                            <button 
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold disabled:opacity-30 hover:bg-slate-50 transition"
                            >
                                Prev
                            </button>
                            <button 
                                disabled={page * 10 >= total}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold disabled:opacity-30 hover:bg-slate-50 transition"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {rows.length === 0 && !isLoading && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm italic">No service orders found matching your criteria.</p>
                </div>
            )}

            {/* Create Order Modal */}
            <Modal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                title="Create New Service Order"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Select Active Room/Guest</label>
                        <Select
                            value={selectedDetailId || ''}
                            onChange={(e) => setSelectedDetailId(Number(e.target.value))}
                        >
                            <option value="">-- Select Room --</option>
                            {activeRooms.map((r) => (
                                <option key={r.bookingDetailId} value={r.bookingDetailId}>
                                    Room {r.roomNumber} - {r.guestName}
                                </option>
                            ))}
                        </Select>
                        {activeRooms.length === 0 && (
                            <p className="text-xs text-amber-600 italic">No guests currently checked-in.</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            onClick={() => setOpenCreate(false)}
                            className="px-4 py-2 text-sm border rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => void handleCreateOrder()}
                            disabled={isCreating || !selectedDetailId}
                            className="bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                        >
                            {isCreating ? 'Creating...' : 'Create Order'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
