import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
    ArrowLeftIcon, 
    PlusIcon, 
    TrashIcon, 
    CheckCircleIcon,
    XCircleIcon,
    MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import { orderServicesApi } from '../../../api/orderServicesApi';
import { servicesApi } from '../../../api/servicesApi';
import type { OrderService, Service, OrderServiceDetail } from '../../../types/models';
import { toApiError } from '../../../api/httpClient';
import { Table } from '../../../components/Table';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { useDebounce } from '../../../hooks/useDebounce';
import { Badge } from '../../../components/Badge';

export function OrderServiceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const orderId = Number(id);

    const [order, setOrder] = useState<OrderService | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isAdding, setIsAdding] = useState(false);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const isLocked = order?.bookingStatus === 'CheckedOut';

    const loadOrder = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await orderServicesApi.getById(orderId);
            setOrder(data);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load order');
            navigate('/admin/reception/order-services');
        } finally {
            setIsLoading(false);
        }
    }, [orderId, navigate]);

    useEffect(() => {
        void loadOrder();
    }, [loadOrder]);

    const searchServices = useCallback(async (val: string) => {
        setIsSearching(true);
        try {
            const result = await servicesApi.getPaged({
                search: val,
                isActive: true,
                page: 1,
                pageSize: 20 // Increase page size for better selection
            });
            setAvailableServices(result.items);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        if (isAdding) {
            void searchServices(debouncedSearch);
        }
    }, [debouncedSearch, isAdding, searchServices]);

    const addService = async (service: Service) => {
        try {
            await orderServicesApi.addItem(orderId, {
                serviceId: service.id,
                quantity: 1
            });
            toast.success(`${service.name} added to order`);
            await loadOrder();
            setIsAdding(false);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to add service');
        }
    };

    const updateQuantity = async (serviceId: number, delta: number, current: number) => {
        const newQty = current + delta;
        if (newQty <= 0) return;

        try {
            await orderServicesApi.updateItem(orderId, serviceId, { quantity: newQty });
            setOrder(prev => prev ? {
                ...prev,
                details: prev.details?.map(d => d.serviceId === serviceId ? { ...d, quantity: newQty } : d)
            } : null);
            // We should really reload for total amount, or calc locally
            await loadOrder(); 
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to update quantity');
        }
    };

    const removeItem = async (serviceId: number) => {
        if (!window.confirm('Remove this item from order?')) return;
        try {
            await orderServicesApi.removeItem(orderId, serviceId);
            toast.success('Item removed');
            await loadOrder();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to remove item');
        }
    };

    const changeStatus = async (status: 'Completed' | 'Cancelled') => {
        try {
            await orderServicesApi.changeStatus(orderId, status);
            toast.success(`Order marked as ${status}`);
            await loadOrder();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to change status');
        }
    };

    const columns = [
        { key: 'name', label: 'Service', render: (row: OrderServiceDetail) => row.serviceName },
        { key: 'unit', label: 'Unit', render: (row: OrderServiceDetail) => row.unit },
        { 
            key: 'price', 
            label: 'Unit Price', 
            render: (row: OrderServiceDetail) => `$${row.unitPrice.toLocaleString()}` 
        },
        { 
            key: 'qty', 
            label: 'Qty', 
            render: (row: OrderServiceDetail) => (
                <div className="flex items-center gap-2">
                    <button 
                        disabled={isLocked || row.quantity <= 1}
                        onClick={() => void updateQuantity(row.serviceId, -1, row.quantity)}
                        className="w-6 h-6 border rounded hover:bg-slate-50 disabled:opacity-30"
                    >
                        -
                    </button>
                    <span className="w-8 text-center">{row.quantity}</span>
                    <button 
                        disabled={isLocked}
                        onClick={() => void updateQuantity(row.serviceId, 1, row.quantity)}
                        className="w-6 h-6 border rounded hover:bg-slate-50 disabled:opacity-30"
                    >
                        +
                    </button>
                </div>
            ) 
        },
        { 
            key: 'subtotal', 
            label: 'Subtotal', 
            render: (row: OrderServiceDetail) => (
                <span className="font-semibold text-slate-900">
                    ${(row.quantity * row.unitPrice).toLocaleString()}
                </span>
            ) 
        },
        {
            key: 'actions',
            label: '',
            render: (row: OrderServiceDetail) => (
                <button 
                    disabled={isLocked}
                    onClick={() => void removeItem(row.serviceId)}
                    className="text-red-500 hover:text-red-700 disabled:opacity-30"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            )
        }
    ];

    if (isLoading && !order) return <div className="p-10 text-center text-slate-500">Loading order...</div>;
    if (!order) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => navigate('/admin/reception/order-services')}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-700 transition"
                >
                    <ArrowLeftIcon className="h-4 w-4" /> Back to List
                </button>
                <div className="flex gap-2">
                    {order.status === 'Pending' && !isLocked && (
                        <>
                            <button 
                                onClick={() => void changeStatus('Completed')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold"
                            >
                                <CheckCircleIcon className="h-4 w-4" /> Mark Completed
                            </button>
                            <button 
                                onClick={() => void changeStatus('Cancelled')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-semibold"
                            >
                                <XCircleIcon className="h-4 w-4" /> Cancel Order
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-900">Order Items</h3>
                            {!isLocked && (
                                <button 
                                    onClick={() => setIsAdding(true)}
                                    className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-800 font-semibold text-sm"
                                >
                                    <PlusIcon className="h-4 w-4" /> Add Service
                                </button>
                            )}
                        </div>
                        <Table columns={columns} rows={order.details || []} />
                        {(!order.details || order.details.length === 0) && (
                            <div className="p-12 text-center">
                                <p className="text-slate-400 text-sm italic">No services added to this order.</p>
                            </div>
                        )}
                        <div className="p-6 border-t border-slate-100 flex justify-end">
                            <div className="text-right">
                                <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Total Amount</p>
                                <p className="text-3xl font-black text-cyan-950">${order.totalAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                        <h3 className="font-bold text-slate-900">Order Information</h3>
                        
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Order ID</p>
                            <p className="font-medium text-slate-900">#{order.id}</p>
                        </div>
                        
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Guest Name</p>
                            <p className="font-medium text-slate-900">{order.guestName || 'N/A'}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Room</p>
                            <p className="font-medium text-slate-900">{order.roomNumber || 'N/A'}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Booking Status</p>
                            <Badge value={order.bookingStatus || 'Unknown'} />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                           <div className="space-y-1">
                                <p className="text-xs text-slate-500 uppercase font-semibold">Order Status</p>
                                <div className={`inline-block px-3 py-1 rounded-lg text-sm font-bold border ${
                                    order.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                    'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                    {order.status}
                                </div>
                           </div>
                        </div>

                        {isLocked && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-medium">
                                ⚠ This order is locked because the booking has been checked out.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal open={isAdding} title="Add Service to Order" onClose={() => {
                setIsAdding(false);
                setSearch('');
            }}>
                <div className="space-y-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            className="pl-9" 
                            placeholder="Find service..." 
                            value={search} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} 
                        />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {isSearching ? (
                            <div className="p-4 text-center text-xs text-slate-400">Searching...</div>
                        ) : availableServices.length > 0 ? (
                            availableServices.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => void addService(s)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-cyan-50 border border-slate-100 transition group"
                                >
                                    <div className="text-left">
                                        <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                                        <p className="text-xs text-slate-500">{s.categoryName}</p>
                                    </div>
                                    <div className="text-right group-hover:text-cyan-700">
                                        <p className="font-bold text-sm">${s.price.toLocaleString()}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Add +</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-xs text-slate-400">No services found</div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
