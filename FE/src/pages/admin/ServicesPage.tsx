import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PencilSquareIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { servicesApi } from '../../api/servicesApi';
import type { Service, ServiceCategory } from '../../types/models';
import { toApiError } from '../../api/httpClient';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { Pagination } from '../../components/Pagination';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { useDebounce } from '../../hooks/useDebounce';
import { Badge } from '../../components/Badge';

import { CategorySelect } from '../../components/CategorySelect';

export function ServicesPage() {
    const { ensure } = usePermissionCheck();
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [rows, setRows] = useState<Service[]>([]);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Create/Edit state
    const [openModal, setOpenModal] = useState(false);
    const [editing, setEditing] = useState<Service | null>(null);
    const [formData, setFormData] = useState({
        categoryId: undefined as number | undefined,
        name: '',
        price: 0,
        unit: 'Per Item',
        isActive: true
    });
    const [isSaving, setIsSaving] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await servicesApi.getPaged({
                search: debouncedSearch,
                categoryId: selectedCategory || undefined,
                sortBy,
                sortOrder,
                page,
                pageSize: 10
            });
            setRows(result.items);
            setTotal(result.total);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load services');
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, selectedCategory, sortBy, sortOrder, page]);

    const loadCategories = useCallback(async () => {
        try {
            const data = await servicesApi.getCategories();
            setCategories(data.filter(c => c.isActive));
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        void loadCategories();
    }, [loadCategories]);

    const handleSave = async () => {
        if (!ensure('MANAGE_SERVICES', editing ? 'update service' : 'create service')) return;

        if (!formData.name.trim()) return toast.error('Name is required');
        if (formData.price <= 0) return toast.error('Price must be > 0');
        if (!formData.unit.trim()) return toast.error('Unit is required');

        setIsSaving(true);
        try {
            if (editing) {
                await servicesApi.update(editing.id, { ...formData, isActive: formData.isActive });
                toast.success('Service updated');
            } else {
                await servicesApi.create(formData);
                toast.success('Service created');
            }
            setOpenModal(false);
            await loadData();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to save service');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteService = async (id: number) => {
        if (!ensure('MANAGE_SERVICES', 'delete service')) return;
        if (!window.confirm('Are you sure you want to delete this service?')) return;

        try {
            await servicesApi.delete(id);
            toast.success('Service deactivated');
            await loadData();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to delete service');
        }
    };

    const restoreService = async (id: number) => {
        if (!ensure('MANAGE_SERVICES', 'restore service')) return;
        if (!window.confirm('Are you sure you want to restore this service?')) return;

        try {
            await servicesApi.restoreService(id);
            toast.success('Service restored');
            await loadData();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to restore service');
        }
    };

    const toggleActive = async (item: Service) => {
        if (!ensure('MANAGE_SERVICES', 'toggle status')) return;

        try {
            await servicesApi.toggleServiceActive(item.id);
            toast.success(`Service ${item.isActive ? 'deactivated' : 'activated'}`);
            await loadData();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to toggle status');
        }
    };

    const columns = [
        { key: 'id', label: 'ID', render: (row: Service) => row.id },
        { key: 'name', label: 'Service Name', render: (row: Service) => row.name },
        { key: 'category', label: 'Category', render: (row: Service) => row.categoryName || '-' },
        { 
            key: 'price', 
            label: 'Price / Unit', 
            render: (row: Service) => (
                <span className="font-semibold text-cyan-700">
                    ${row.price.toLocaleString()} / {row.unit}
                </span>
            ) 
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: Service) => (
                <button onClick={() => void toggleActive(row)}>
                    <Badge value={row.isActive ? 'Active' : 'Inactive'} />
                </button>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: Service) => (
                <div className="flex gap-2">
                    <button
                        className="p-1 hover:text-cyan-600"
                        onClick={() => {
                            setEditing(row);
                            setFormData({
                                categoryId: row.categoryId,
                                name: row.name,
                                price: row.price,
                                unit: row.unit,
                                isActive: row.isActive
                            });
                            setOpenModal(true);
                        }}
                    >
                        <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    {row.isActive ? (
                        <button className="p-1 hover:text-red-600" onClick={() => void deleteService(row.id)}>
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    ) : (
                        <button className="p-1 hover:text-emerald-600" onClick={() => void restoreService(row.id)} title="Restore Service">
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    const resetFilters = () => {
        setSearch('');
        setSelectedCategory(null);
        setSortBy('id');
        setSortOrder('asc');
        setPage(1);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Services</h2>
                    <p className="text-sm text-slate-500">Manage hotel service catalog and pricing.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setOpenModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
                    >
                        <PlusIcon className="h-4 w-4" /> Add Service
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        className="pl-9" 
                        placeholder="Search name..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                </div>
                <CategorySelect 
                    categories={categories}
                    selectedId={selectedCategory}
                    onChange={(id) => setSelectedCategory(id)}
                    placeholder="All Categories"
                />
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="id">Sort by ID</option>
                    <option value="price">Sort by Price</option>
                    <option value="name">Sort by Name</option>
                </Select>
                <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </Select>
                <button
                    onClick={resetFilters}
                    title="Reset Filters"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                >
                    <ArrowPathIcon className="h-5 w-5" />
                </button>
            </div>

            <Table columns={columns} rows={isLoading ? [] : rows} />
            
            <Pagination 
                page={page} 
                pageSize={10} 
                total={total} 
                onPageChange={(p) => setPage(p)} 
            />

            {/* Create/Edit Modal */}
            <Modal 
                open={openModal} 
                title={editing ? 'Edit Service' : 'Add New Service'} 
                onClose={() => {
                    setOpenModal(false);
                    setEditing(null);
                    setFormData({ categoryId: undefined, name: '', price: 0, unit: 'Per Item', isActive: true });
                }}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Category</label>
                        <Select 
                            value={formData.categoryId || ''} 
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : undefined })}
                        >
                            <option value="">No Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Service Name</label>
                        <Input 
                            value={formData.name} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            placeholder="e.g. Laundry Service"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Price ($)</label>
                            <Input 
                                type="number" 
                                value={formData.price} 
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Unit</label>
                            <Input 
                                value={formData.unit} 
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })} 
                                placeholder="e.g. Per Hour, Per Item"
                            />
                        </div>
                    </div>
                    {editing && (
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                checked={formData.isActive} 
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} 
                            />
                            <label className="text-sm text-slate-700">Active</label>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <button 
                            onClick={() => setOpenModal(false)} 
                            className="px-4 py-2 text-sm border rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => void handleSave()}
                            disabled={isSaving}
                            className="bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Service'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
