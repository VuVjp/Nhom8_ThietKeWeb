import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import invoicesApi from '../../api/invoicesApi';
import type { Invoice } from '../../types/invoices';
import { toApiError } from '../../api/httpClient';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { useNavigate } from 'react-router-dom';

export function InvoicesPage() {
    const navigate = useNavigate();
    const [rows, setRows] = useState<Invoice[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await invoicesApi.getPaged({
                search: search || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                status: statusFilter === 'All' ? undefined : statusFilter,
                sortBy,
                sortOrder,
                page,
                pageSize: 10
            });
            setRows(result.items);
            setTotal(result.total);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load invoices');
        } finally {
            setIsLoading(false);
        }
    }, [search, startDate, endDate, statusFilter, page, sortBy, sortOrder]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const resetFilters = () => {
        setSearch('');
        setStartDate('');
        setEndDate('');
        setStatusFilter('All');
        setSortBy('date');
        setSortOrder('desc');
        setPage(1);
    };

    const columns = [
        {
            key: 'invoiceCode',
            label: 'Code',
            render: (row: Invoice) => (
                <div className="flex flex-col">
                    <span className="font-mono font-medium">{row.invoiceCode}</span>
                    {row.isSplit && (
                        <span className="inline-flex w-fit mt-1 px-1.5 py-0.5 bg-amber-50 text-[10px] font-bold text-amber-600 rounded border border-amber-100 uppercase tracking-tighter">
                            Split Bill
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'guest', label: 'Guest / Room', render: (row: Invoice) => (
                <div>
                    <p className="font-semibold text-slate-900">{row.guestName || '—'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{row.bookingCode || '—'}</span>
                        {row.roomNumber && (
                            <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-1.5 rounded">Room {row.roomNumber}</span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'amount',
            label: 'Total Amount',
            render: (row: Invoice) => (
                <span className="font-bold text-cyan-700">
                    ${row.finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: Invoice) => (
                <Badge
                    value={row.status}
                    variant={row.status === 'Completed' ? 'success' : row.status === 'Cancelled' ? 'destructive' : row.status === 'Pending' ? 'warning' : 'default'}
                />
            )
        },
        {
            key: 'createdAt',
            label: 'Created',
            render: (row: Invoice) => (
                <div className="text-xs text-slate-500">
                    <p className="font-medium text-slate-700">{new Date(row.createdAt).toLocaleDateString()}</p>
                    <p>{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: Invoice) => (
                <button
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
                    onClick={() => navigate(`/admin/invoices/${row.id}`)}
                >
                    <EyeIcon className="h-4 w-4 text-cyan-700" /> View Detail
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoices</h1>
                    <p className="text-sm text-slate-500">Manage and track guest billing and payments.</p>
                </div>
            </div>

            {/* Filter Bar - Patterns from OrderServicePage */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                    <div className="lg:col-span-3 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Search</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                className="pl-9"
                                placeholder="Code, Guest, Booking..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>
                    <div className="lg:col-span-4 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date Range (Created)</label>
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                className="min-w-0 flex-1 px-2"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }}
                            />
                            <Input
                                type="date"
                                className="min-w-0 flex-1 px-2"
                                value={endDate}
                                onChange={(e) => {
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
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                    <div className="lg:col-span-2 space-y-1.5 min-w-0">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Sort By</label>
                        <select
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none appearance-none truncate"
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [s, o] = e.target.value.split('-');
                                setSortBy(s);
                                setSortOrder(o as any);
                                setPage(1);
                            }}
                        >
                            <option value="date-desc">Newest First</option>
                            <option value="date-asc">Oldest First</option>
                            <option value="amount-desc">Amount: High to Low</option>
                            <option value="amount-asc">Amount: Low to High</option>
                            <option value="id-desc">ID: Max to Min</option>
                            <option value="id-asc">ID: Min to Max</option>
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <button
                            onClick={resetFilters}
                            title="Reset Filters"
                            className="flex h-[38px] w-full items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 bg-slate-50"
                        >
                            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-bold text-slate-600 animate-pulse">Loading invoices...</p>
                </div>
            ) : rows.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                        <MagnifyingGlassIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No invoices found</h3>
                    <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md relative">
                    <Table columns={columns} rows={rows} />
                    
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
            )}
        </div>
    );
}
