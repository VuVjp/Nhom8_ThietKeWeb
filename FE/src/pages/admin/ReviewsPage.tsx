import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowPathIcon, StarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { reviewsApi, type ReviewItem } from '../../api/reviewsApi';
import { roomTypesApi, type RoomTypeItem } from '../../api/roomTypesApi';
import { toApiError } from '../../api/httpClient';
import { Table } from '../../components/Table';
import { Select } from '../../components/Select';
import { Input } from '../../components/Input';
import { Pagination } from '../../components/Pagination';
import { Badge } from '../../components/Badge';
import { CategorySelect } from '../../components/CategorySelect';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { useDebounce } from '../../hooks/useDebounce';

export function ReviewsPage() {
    const { ensure } = usePermissionCheck();
    
    // Data state
    const [rows, setRows] = useState<ReviewItem[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [total, setTotal] = useState(0);
    
    // Filter/Pagination state
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [selectedRoomType, setSelectedRoomType] = useState<number | null>(null);
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await reviewsApi.getPaged({
                search: debouncedSearch,
                roomTypeId: selectedRoomType || undefined,
                rating: selectedRating || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                sortBy,
                sortOrder,
                page,
                pageSize: 10
            });
            setRows(result.items);
            setTotal(result.total);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load reviews');
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, selectedRoomType, selectedRating, startDate, endDate, sortBy, sortOrder, page]);

    const loadRoomTypes = useCallback(async () => {
        try {
            const data = await roomTypesApi.getAll();
            setRoomTypes(data);
        } catch (error) {
            console.error('Failed to load room types', error);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        void loadRoomTypes();
    }, [loadRoomTypes]);

    const resetFilters = () => {
        setSearch('');
        setSelectedRoomType(null);
        setSelectedRating(null);
        setStartDate('');
        setEndDate('');
        setSortBy('id');
        setSortOrder('desc');
        setPage(1);
    };

    const toggleStatus = async (item: ReviewItem) => {
        if (!ensure('MANAGE_REVIEWS', 'toggle review status')) {
            return;
        }

        try {
            await reviewsApi.toggleActive(item.id);
            setRows((prev) =>
                prev.map((row) =>
                    row.id === item.id
                        ? { ...row, isActive: !row.isActive }
                        : row,
                ),
            );
            toast.success(`Review #${item.id} is now ${item.isActive ? 'Inactive' : 'Active'}`);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to toggle review status');
        }
    };

    const renderRating = (rating: number) => {
        return (
            <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                    star <= rating ? (
                        <StarIconSolid key={star} className="h-4 w-4" />
                    ) : (
                        <StarIcon key={star} className="h-4 w-4" />
                    )
                ))}
            </div>
        );
    };

    const columns = [
        { key: 'id', label: 'ID', render: (row: ReviewItem) => <span className="font-mono text-xs text-slate-500">#{row.id}</span> },
        {
            key: 'user',
            label: 'User',
            render: (row: ReviewItem) => (
                <div className="flex items-center gap-2">
                    {row.userAvatarUrl ? (
                        <img src={row.userAvatarUrl} alt={row.userName} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                            {row.userName?.charAt(0) || 'U'}
                        </div>
                    )}
                    <span className="font-medium text-slate-900">{row.userName || 'Anonymous'}</span>
                </div>
            ),
        },
        { 
            key: 'roomType', 
            label: 'Room Type', 
            render: (row: ReviewItem) => (
                <span className="text-sm font-medium text-slate-600">{row.roomTypeName || 'N/A'}</span>
            ) 
        },
        {
            key: 'rating',
            label: 'Rating',
            render: (row: ReviewItem) => renderRating(row.rating),
        },
        {
            key: 'comment',
            label: 'Comment',
            render: (row: ReviewItem) => (
                <p className="max-w-xs truncate text-xs text-slate-600" title={row.comment}>
                    {row.comment}
                </p>
            ),
        },
        {
            key: 'date',
            label: 'Review Date',
            render: (row: ReviewItem) => (
                <span className="text-xs text-slate-500">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: ReviewItem) => (
                <button
                    type="button"
                    style={{ cursor: 'pointer' }}
                    onClick={() => void toggleStatus(row)}
                    title="Toggle Status"
                >
                    <Badge value={row.isActive ? 'Active' : 'Inactive'} />
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Guest Ratings</h1>
                    <p className="text-slate-500 text-sm">Monitor and moderate guest reviews and historical feedback.</p>
                </div>
                <button
                    onClick={() => void loadData()}
                    className="inline-flex items-center gap-2 p-2 text-slate-500 hover:text-cyan-600 transition bg-white border border-slate-200 rounded-xl shadow-sm"
                    title="Refresh"
                >
                    <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filter Bar - Matching Order Service Page Layout */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                    
                    {/* Search */}
                    <div className="lg:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Search</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                className="pl-9 h-[38px] rounded-xl" 
                                placeholder="ID, User name..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="lg:col-span-4 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date Range</label>
                        <div className="flex gap-2">
                            <Input 
                                type="date" 
                                className="min-w-0 flex-1 px-2 h-[38px] rounded-xl"
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                            />
                            <Input 
                                type="date"
                                className="min-w-0 flex-1 px-2 h-[38px] rounded-xl"
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* Room Type (Searchable via CategorySelect) */}
                    <div className="lg:col-span-3 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Room Type</label>
                        <CategorySelect 
                            categories={roomTypes}
                            selectedId={selectedRoomType}
                            onChange={(id) => setSelectedRoomType(id)}
                            placeholder="All types"
                        />
                    </div>

                    {/* Rating */}
                    <div className="lg:col-span-1 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Rating</label>
                        <select 
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none appearance-none h-[38px]"
                            value={selectedRating || ''} 
                            onChange={(e) => setSelectedRating(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">All</option>
                            <option value="5">5 ⭐</option>
                            <option value="4">4 ⭐</option>
                            <option value="3">3 ⭐</option>
                            <option value="2">2 ⭐</option>
                            <option value="1">1 ⭐</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="lg:col-span-1 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Sort</label>
                        <select 
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none appearance-none h-[38px]"
                            value={sortOrder} 
                            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                        >
                            <option value="desc">New</option>
                            <option value="asc">Old</option>
                        </select>
                    </div>

                    {/* Reset Button */}
                    <div className="lg:col-span-1">
                        <button
                            onClick={resetFilters}
                            title="Reset Filters"
                            className="flex h-[38px] w-full items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 bg-slate-50"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                <Table columns={columns} rows={isLoading ? [] : rows} />
                
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 transition-all">
                        <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-sm font-bold text-slate-600 animate-pulse">Loading ratings...</p>
                    </div>
                )}

                {!isLoading && rows.length === 0 && (
                    <div className="p-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-400 mb-4">
                            <MagnifyingGlassIcon className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No ratings found</h3>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
                    </div>
                )}
            </div>

            <Pagination 
                page={page} 
                pageSize={10} 
                total={total} 
                onPageChange={(p) => setPage(p)} 
            />
        </div>
    );
}
