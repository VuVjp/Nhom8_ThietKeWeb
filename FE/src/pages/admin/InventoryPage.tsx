import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Table } from '../../components/Table';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';
import type { InventoryItem } from '../../types/models';
import { toApiError } from '../../api/httpClient';
import { roomInventoriesApi, type UpdateRoomInventoryPayload } from '../../api/roomInventoriesApi';
import { paginate, queryIncludes, sortBy } from '../../utils/table';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

export function InventoryPage() {
    const { ensure } = usePermissionCheck();
    const [rows, setRows] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [sortField, setSortField] = useState<'name' | 'code'>('name');
    const [page, setPage] = useState(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadInventory = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await roomInventoriesApi.getAll();
            setRows(data);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load inventory');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingItem(null);
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;

        setIsSaving(true);
        try {
            const payload: UpdateRoomInventoryPayload = {
                itemName: editingItem.name,
                quantity: editingItem.quantity,
                priceIfLost: editingItem.compensationPrice,
            };

            await roomInventoriesApi.update(editingItem.id, payload);

            setRows((prev) =>
                prev.map((item) => (item.id === editingItem.id ? editingItem : item))
            );

            toast.success(`Updated ${editingItem.code} successfully`);
            handleCloseEditModal();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to update inventory item');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        void loadInventory();
    }, [loadInventory]);

    const filtered = useMemo(() => {
        const next = rows.filter((item) => {
            const byQuery = queryIncludes(item.name, search) || queryIncludes(item.code, search);
            const byCategory = category === 'all' || item.category === category;
            return byQuery && byCategory;
        });

        return sortBy(next, (item) => (sortField === 'name' ? item.name : item.code), 'asc');
    }, [rows, search, category, sortField]);

    const pageSize = 10;
    const paged = paginate(filtered, page, pageSize);

    const columns = [
        { key: 'code', label: 'Code', render: (row: InventoryItem) => row.code },
        { key: 'name', label: 'Name', render: (row: InventoryItem) => row.name },
        { key: 'category', label: 'Category', render: (row: InventoryItem) => row.category },
        { key: 'unit', label: 'Unit', render: (row: InventoryItem) => row.unit },
        { key: 'price', label: 'Price', render: (row: InventoryItem) => `$${row.price}` },
        { key: 'stock', label: 'Stock', render: (row: InventoryItem) => row.stock },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: InventoryItem) => (
                <div className="flex gap-2">

                    <button
                        type="button"
                        className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                        onClick={() => {
                            if (!ensure('delete_room_inventory', 'delete inventory item')) {
                                return;
                            }
                            void (async () => {
                                try {
                                    await roomInventoriesApi.remove(row.id);
                                    setRows((prev) => prev.filter((item) => item.id !== row.id));
                                    toast.success(`Deleted ${row.code}`);
                                } catch (error) {
                                    const apiError = toApiError(error);
                                    toast.error(apiError.message || 'Failed to delete inventory item');
                                }
                            })();
                        }}
                    >
                        Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
                <p className="text-sm text-slate-500">Search, sort, filter and maintain hotel inventory.</p>
            </div>

            <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
                <Input placeholder="Search by name or code" value={search} onChange={(e) => setSearch(e.target.value)} />
                <Select value={sortField} onChange={(e) => setSortField(e.target.value as 'name' | 'code')}><option value="name">Sort: Name</option><option value="code">Sort: Code</option></Select>
                <Select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All Categories</option><option>Linen</option><option>Bathroom</option><option>Electronics</option><option>Minibar</option></Select>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 flex-1"
                        onClick={() => {
                            setSearch('');
                            setCategory('all');
                            setSortField('name');
                            void loadInventory();
                            toast('Filters refreshed', { icon: 'ℹ️' });
                        }}
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <Table columns={columns} rows={isLoading ? [] : paged} />
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />

            <Modal
                open={isEditModalOpen}
                title={editingItem ? `Edit ${editingItem.code}` : 'Edit Item'}
                onClose={handleCloseEditModal}
            >
                {editingItem && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Item Name</label>
                            <Input
                                value={editingItem.name}
                                onChange={(e) =>
                                    setEditingItem({ ...editingItem, name: e.target.value })
                                }
                                placeholder="Enter item name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">Category</label>
                            <Select
                                value={editingItem.category}
                                onChange={(e) =>
                                    setEditingItem({
                                        ...editingItem,
                                        category: e.target.value as
                                            | 'Linen'
                                            | 'Bathroom'
                                            | 'Electronics'
                                            | 'Minibar',
                                    })
                                }
                            >
                                <option value="Linen">Linen</option>
                                <option value="Bathroom">Bathroom</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Minibar">Minibar</option>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">Unit</label>
                            <Input
                                value={editingItem.unit}
                                onChange={(e) =>
                                    setEditingItem({ ...editingItem, unit: e.target.value })
                                }
                                placeholder="e.g., pcs, kg, liter"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Quantity
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={editingItem.quantity}
                                    onChange={(e) =>
                                        setEditingItem({
                                            ...editingItem,
                                            quantity: Number(e.target.value),
                                        })
                                    }
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Price If Lost
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editingItem.compensationPrice}
                                    onChange={(e) =>
                                        setEditingItem({
                                            ...editingItem,
                                            compensationPrice: Number(e.target.value),
                                        })
                                    }
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                            <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                onClick={handleCloseEditModal}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800 disabled:opacity-50"
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
}
