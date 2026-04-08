import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PencilSquareIcon, PlusIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import { servicesApi } from '../../api/servicesApi';
import type { ServiceCategory } from '../../types/models';
import { toApiError } from '../../api/httpClient';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { Badge } from '../../components/Badge';

export function ServiceCategoriesPage() {
    const { ensure } = usePermissionCheck();
    const [rows, setRows] = useState<ServiceCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [createName, setCreateName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);

    const [editing, setEditing] = useState<ServiceCategory | null>(null);
    const [editName, setEditName] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const loadCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await servicesApi.getCategories();
            setRows(data);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCategories();
    }, [loadCategories]);

    const createCategory = async () => {
        if (!ensure('MANAGE_SERVICES', 'create category')) return;

        if (!createName.trim()) {
            toast.error('Category name is required');
            return;
        }

        setIsCreating(true);
        try {
            await servicesApi.createCategory({ name: createName.trim() });
            toast.success('Category created');
            setCreateName('');
            setOpenCreate(false);
            await loadCategories();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to create category');
        } finally {
            setIsCreating(false);
        }
    };

    const saveEdit = async () => {
        if (!editing) return;
        if (!ensure('MANAGE_SERVICES', 'update category')) return;

        if (!editName.trim()) {
            toast.error('Category name is required');
            return;
        }

        setIsSavingEdit(true);
        try {
            await servicesApi.updateCategory(editing.id, {
                name: editName.trim(),
                isActive: editing.isActive,
            });
            toast.success('Category updated');
            setEditing(null);
            await loadCategories();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to update category');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const toggleActive = async (item: ServiceCategory) => {
        if (!ensure('MANAGE_SERVICES', 'toggle status')) return;

        try {
            await servicesApi.toggleCategoryActive(item.id);
            toast.success(`Category ${item.isActive ? 'deactivated' : 'activated'}`);
            await loadCategories();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to toggle status');
        }
    };

    const deleteCategory = async (id: number) => {
        if (!ensure('MANAGE_SERVICES', 'delete category')) return;
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            await servicesApi.deleteCategory(id);
            toast.success('Category deleted');
            await loadCategories();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to delete category');
        }
    };

    const columns = [
        { key: 'id', label: 'ID', render: (row: ServiceCategory) => row.id },
        { key: 'name', label: 'Name', render: (row: ServiceCategory) => row.name },
        {
            key: 'status',
            label: 'Status',
            render: (row: ServiceCategory) => (
                <button onClick={() => void toggleActive(row)}>
                    <Badge value={row.isActive ? 'Active' : 'Inactive'} />
                </button>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: ServiceCategory) => (
                <div className="flex gap-2">
                    <button
                        className="p-1 hover:text-cyan-600"
                        onClick={() => {
                            setEditing(row);
                            setEditName(row.name);
                        }}
                    >
                        <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button className="p-1 hover:text-red-600" onClick={() => void deleteCategory(row.id)}>
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Service Categories</h2>
                    <p className="text-sm text-slate-500">Manage categories for hotel services.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => void loadCategories()} className="p-2 border rounded-xl hover:bg-slate-50">
                        <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setOpenCreate(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
                    >
                        <PlusIcon className="h-4 w-4" /> Add Category
                    </button>
                </div>
            </div>

            <Table columns={columns} rows={isLoading ? [] : rows} />

            {/* Create Modal */}
            <Modal open={openCreate} title="Add Service Category" onClose={() => setOpenCreate(false)}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Category Name</label>
                        <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Food & Beverage" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setOpenCreate(false)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
                        <button
                            onClick={() => void createCategory()}
                            disabled={isCreating}
                            className="bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                        >
                            {isCreating ? 'Saving...' : 'Save Category'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal open={Boolean(editing)} title="Edit Category" onClose={() => setEditing(null)}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Category Name</label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
                        <button
                            onClick={() => void saveEdit()}
                            disabled={isSavingEdit}
                            className="bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                        >
                            {isSavingEdit ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
