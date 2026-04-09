import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
    ArrowLeftIcon, 
    MagnifyingGlassIcon,
    PlusIcon,
    ShoppingBagIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { orderServicesApi } from '../../../api/orderServicesApi';
import { servicesApi } from '../../../api/servicesApi';
import type { OrderService, Service } from '../../../types/models';
import { toApiError } from '../../../api/httpClient';
import { Input } from '../../../components/Input';
import { useDebounce } from '../../../hooks/useDebounce';
import { CategorySelect } from '../../../components/CategorySelect';
import { Pagination } from '../../../components/Pagination';

export function AddServiceToOrderPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const orderId = Number(id);

    const [order, setOrder] = useState<OrderService | null>(null);
    const [isLoadingOrder, setIsLoadingOrder] = useState(true);
    
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 12;

    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [addingIds, setAddingIds] = useState<number[]>([]);

    const loadOrder = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoadingOrder(true);
        try {
            const data = await orderServicesApi.getById(orderId);
            setOrder(data);
            if (data.bookingStatus === 'CheckedOut') {
                toast.error('Cannot add services to a checked-out booking');
                navigate(`/admin/reception/order-services/${orderId}`);
            }
        } catch (error) {
            toast.error('Failed to load order');
            navigate('/admin/reception/order-services');
        } finally {
            if (showLoading) setIsLoadingOrder(false);
        }
    }, [orderId, navigate]);

    const loadCategories = useCallback(async () => {
        try {
            const data = await servicesApi.getCategories();
            setCategories(data.filter(c => c.isActive));
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    }, []);

    const searchServices = useCallback(async () => {
        setIsLoadingServices(true);
        try {
            const result = await servicesApi.getPaged({
                search: debouncedSearch,
                categoryId: selectedCategory || undefined,
                isActive: true,
                page,
                pageSize
            });
            setAvailableServices(result.items);
            setTotal(result.total);
        } catch (error) {
            toast.error('Failed to search services');
        } finally {
            setIsLoadingServices(false);
        }
    }, [debouncedSearch, selectedCategory, page]);

    useEffect(() => {
        void loadOrder();
        void loadCategories();
    }, [loadOrder, loadCategories]);

    useEffect(() => {
        void searchServices();
    }, [searchServices]);

    // Reset page when search or category changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedCategory]);

    const handleAddService = async (service: Service) => {
        setAddingIds(prev => [...prev, service.id]);
        try {
            await orderServicesApi.addItem(orderId, {
                serviceId: service.id,
                quantity: 1
            });
            toast.success(`${service.name} added`);
            // Refresh order to update counts without full page reload state
            await loadOrder(false);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to add service');
        } finally {
            setAddingIds(prev => prev.filter(id => id !== service.id));
        }
    };

    const getAddedQuantity = (serviceId: number) => {
        return order?.details?.find(d => d.serviceId === serviceId)?.quantity || 0;
    };

    if (isLoadingOrder) {
        return <div className="p-10 text-center text-slate-500">Loading order info...</div>;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(`/admin/reception/order-services/${orderId}`)}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm"
                    >
                        <ArrowLeftIcon className="h-5 w-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Add Services</h1>
                        <p className="text-sm text-slate-500">
                            Order #{orderId} — Room {order?.roomNumber} ({order?.guestName})
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/admin/reception/order-services/${orderId}`)}
                    className="px-6 py-2 rounded-xl bg-cyan-700 text-white font-semibold hover:bg-cyan-800 transition shadow-sm"
                >
                    Finish Adding
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:w-80">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                            className="pl-10 h-10 border-slate-200 focus:border-cyan-500 rounded-xl" 
                            placeholder="Search by service name..." 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <CategorySelect 
                            categories={categories}
                            selectedId={selectedCategory}
                            onChange={(id) => setSelectedCategory(id)}
                            placeholder="All Categories"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setSearch('');
                            setSelectedCategory(null);
                        }}
                        title="Reset Filters"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 bg-slate-50"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {isLoadingServices ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-40 bg-slate-50 rounded-2xl animate-pulse" />
                        ))
                    ) : availableServices.length > 0 ? (
                        availableServices.map(service => {
                            const addedQty = getAddedQuantity(service.id);
                            const isAdded = addedQty > 0;
                            
                            return (
                                <div 
                                    key={service.id}
                                    className={`group relative p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                                        isAdded 
                                        ? 'border-emerald-200 bg-emerald-50/20 shadow-sm' 
                                        : 'border-slate-100 bg-white hover:border-cyan-200 hover:shadow-md'
                                    }`}
                                >
                                    {isAdded && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                            <ShoppingBagIcon className="h-3 w-3" />
                                            {addedQty} in Order
                                        </div>
                                    )}
                                    
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                            {service.categoryName || 'General'}
                                        </p>
                                        <h4 className="font-bold text-slate-900 group-hover:text-cyan-700 transition line-clamp-1">
                                            {service.name}
                                        </h4>
                                        <div className="mt-3 flex items-baseline gap-1">
                                            <span className="text-lg font-black text-slate-900">${service.price.toLocaleString()}</span>
                                            <span className="text-[10px] text-slate-400 font-medium uppercase">/ {service.unit}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => void handleAddService(service)}
                                        disabled={addingIds.length > 0}
                                        className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                            addingIds.includes(service.id)
                                            ? 'bg-slate-100 text-slate-400'
                                            : addingIds.length > 0
                                                ? 'bg-slate-50 text-slate-300 pointer-events-none'
                                                : isAdded 
                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200'
                                                    : 'bg-slate-900 text-white hover:bg-cyan-700 shadow-sm'
                                        }`}
                                    >
                                        {addingIds.includes(service.id) ? (
                                            <div className="h-4 w-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <PlusIcon className="h-4 w-4" />
                                                {isAdded ? 'Add More' : 'Add to Order'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-slate-400 mb-4 shadow-sm">
                                <MagnifyingGlassIcon className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No services found</h3>
                            <p className="text-slate-500 text-sm mt-1">Try a different search term or category.</p>
                        </div>
                    )}
                </div>

                {total > pageSize && (
                    <div className="pt-6 border-t border-slate-100">
                        <Pagination 
                            page={page} 
                            pageSize={pageSize} 
                            total={total} 
                            onPageChange={(p) => setPage(p)} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
