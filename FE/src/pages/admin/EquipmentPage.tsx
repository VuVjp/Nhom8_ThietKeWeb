import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';
import { toApiError } from '../../api/httpClient';
import { equipmentsApi, type EquipmentItem } from '../../api/equipmentsApi';
import { paginate, queryIncludes, sortBy } from '../../utils/table';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

const initialForm = {
    itemCode: '',
    name: '',
    category: '',
    unit: '',
    totalQuantity: '0',
    basePrice: '0',
    defaultPriceIfLost: '0',
    supplier: '',
};

export function EquipmentPage() {
    const { ensure } = usePermissionCheck();
    const [rows, setRows] = useState<EquipmentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<'name' | 'itemCode'>('name');
    const [page, setPage] = useState(1);
    const [form, setForm] = useState(initialForm);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const loadEquipments = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await equipmentsApi.getAll();
            setRows(data);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load equipments');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadEquipments();
    }, [loadEquipments]);

    const filtered = useMemo(() => {
        const next = rows.filter((item) => {
            return (
                queryIncludes(item.name, search) ||
                queryIncludes(item.itemCode, search) ||
                queryIncludes(item.category, search)
            );
        });

        return sortBy(next, (item) => (sortField === 'name' ? item.name : item.itemCode), 'asc');
    }, [rows, search, sortField]);

    const pageSize = 8;
    const paged = paginate(filtered, page, pageSize);

    const columns = [
        { key: 'itemCode', label: 'Code', render: (row: EquipmentItem) => row.itemCode },
        { key: 'name', label: 'Name', render: (row: EquipmentItem) => row.name },
        { key: 'category', label: 'Category', render: (row: EquipmentItem) => row.category },
        { key: 'unit', label: 'Unit', render: (row: EquipmentItem) => row.unit },
        { key: 'totalQty', label: 'Total Qty', render: (row: EquipmentItem) => row.totalQuantity },
        { key: 'inUseQty', label: 'In Use Qty', render: (row: EquipmentItem) => row.inUseQuantity },
        { key: 'damagedQty', label: 'Damaged Qty', render: (row: EquipmentItem) => row.damagedQuantity },
        { key: 'basePrice', label: 'Base Price', render: (row: EquipmentItem) => `$${row.basePrice}` },
        {
            key: 'image',
            label: 'Image',
            render: (row: EquipmentItem) =>
                row.imageUrl ? (
                    <a className="text-cyan-700 underline" href={row.imageUrl} target="_blank" rel="noreferrer">
                        View
                    </a>
                ) : (
                    <span className="text-slate-400">-</span>
                ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: EquipmentItem) => (
                <button
                    type="button"
                    className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                    onClick={() => {
                        if (!ensure('delete_amenity', 'delete equipment')) {
                            return;
                        }

                        void (async () => {
                            try {
                                await equipmentsApi.remove(row.id);
                                setRows((prev) => prev.filter((item) => item.id !== row.id));
                                toast.success(`Deleted ${row.itemCode}`);
                            } catch (error) {
                                const apiError = toApiError(error);
                                toast.error(apiError.message || 'Failed to delete equipment');
                            }
                        })();
                    }}
                >
                    Delete
                </button>
            ),
        },
    ];

    const createItem = async () => {
        if (!ensure('create_amenity', 'create equipment')) {
            return false;
        }

        if (!form.itemCode.trim() || !form.name.trim() || !form.category.trim() || !form.unit.trim()) {
            toast.error('Item code, name, category and unit are required');
            return false;
        }

        setIsCreating(true);
        try {
            await equipmentsApi.create({
                itemCode: form.itemCode.trim(),
                name: form.name.trim(),
                category: form.category.trim(),
                unit: form.unit.trim(),
                totalQuantity: Number(form.totalQuantity),
                basePrice: Number(form.basePrice),
                defaultPriceIfLost: Number(form.defaultPriceIfLost),
                supplier: form.supplier.trim(),
                file: selectedFile,
            });

            toast.success('Equipment created');
            setForm(initialForm);
            setSelectedFile(null);
            await loadEquipments();
            return true;
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to create equipment');
            return false;
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Equipments</h2>
                    <p className="text-sm text-slate-500">Add and manage amenity items used in rooms.</p>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
                    onClick={() => setOpenCreate(true)}
                >
                    <PlusIcon className="h-4 w-4" /> Add Equipment
                </button>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
                <Input placeholder="Search by code, name or category" value={search} onChange={(e) => setSearch(e.target.value)} />
                <select
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as 'name' | 'itemCode')}
                >
                    <option value="name">Sort: Name</option>
                    <option value="itemCode">Sort: Code</option>
                </select>
            </div>

            <Table columns={columns} rows={isLoading ? [] : paged} />
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />

            <Modal
                open={openCreate}
                title="Add Equipment"
                onClose={() => {
                    setOpenCreate(false);
                    setForm(initialForm);
                    setSelectedFile(null);
                }}
            >
                <div className="space-y-5">
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Equipment details</h3>
                            <p className="text-xs text-slate-500">Fill in the identifying information for the equipment item.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Item code</label>
                                <Input placeholder="Example: EQ-001" value={form.itemCode} onChange={(e) => setForm((prev) => ({ ...prev, itemCode: e.target.value }))} />
                                <p className="text-xs text-slate-500">Unique code used in inventory lookup.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Name</label>
                                <Input placeholder="Example: Hair Dryer" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                                <p className="text-xs text-slate-500">Visible equipment name.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Category</label>
                                <Input placeholder="Example: Electronics" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} />
                                <p className="text-xs text-slate-500">Group or category of this item.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Unit</label>
                                <Input placeholder="Example: piece" value={form.unit} onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))} />
                                <p className="text-xs text-slate-500">Measurement unit for quantity.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Quantity and price</h3>
                            <p className="text-xs text-slate-500">Set inventory count and compensation values.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Total quantity</label>
                                <Input type="number" min={0} placeholder="0" value={form.totalQuantity} onChange={(e) => setForm((prev) => ({ ...prev, totalQuantity: e.target.value }))} />
                                <p className="text-xs text-slate-500">Total units in stock.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Base price</label>
                                <Input type="number" min={0} placeholder="0" value={form.basePrice} onChange={(e) => setForm((prev) => ({ ...prev, basePrice: e.target.value }))} />
                                <p className="text-xs text-slate-500">Default unit price.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Default price if lost</label>
                                <Input type="number" min={0} placeholder="0" value={form.defaultPriceIfLost} onChange={(e) => setForm((prev) => ({ ...prev, defaultPriceIfLost: e.target.value }))} />
                                <p className="text-xs text-slate-500">Compensation value when item is lost.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Additional info</h3>
                            <p className="text-xs text-slate-500">Supplier and image are optional but recommended.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Supplier</label>
                                <Input placeholder="Example: LG / Panasonic" value={form.supplier} onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))} />
                                <p className="text-xs text-slate-500">Manufacturer or vendor name.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Image</label>
                                <Input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
                                <p className="text-xs text-slate-500">Upload a photo for faster recognition.</p>
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            onClick={() => {
                                setOpenCreate(false);
                                setForm(initialForm);
                                setSelectedFile(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            onClick={() =>
                                void (async () => {
                                    const created = await createItem();
                                    if (created) {
                                        setOpenCreate(false);
                                    }
                                })()
                            }
                            disabled={isCreating}
                        >
                            {isCreating ? 'Saving...' : 'Save Equipment'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
