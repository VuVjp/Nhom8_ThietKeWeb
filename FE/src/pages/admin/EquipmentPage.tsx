import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Pagination } from '../../components/Pagination';
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
            return;
        }

        if (!form.itemCode.trim() || !form.name.trim() || !form.category.trim() || !form.unit.trim()) {
            toast.error('Item code, name, category and unit are required');
            return;
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
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to create equipment');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Equipments</h2>
                <p className="text-sm text-slate-500">Add and manage amenity items used in rooms.</p>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
                <Input placeholder="Item code" value={form.itemCode} onChange={(e) => setForm((prev) => ({ ...prev, itemCode: e.target.value }))} />
                <Input placeholder="Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                <Input placeholder="Category" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} />
                <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))} />
                <Input type="number" min={0} placeholder="Total quantity" value={form.totalQuantity} onChange={(e) => setForm((prev) => ({ ...prev, totalQuantity: e.target.value }))} />
                <Input type="number" min={0} placeholder="Base price" value={form.basePrice} onChange={(e) => setForm((prev) => ({ ...prev, basePrice: e.target.value }))} />
                <Input type="number" min={0} placeholder="Default price if lost" value={form.defaultPriceIfLost} onChange={(e) => setForm((prev) => ({ ...prev, defaultPriceIfLost: e.target.value }))} />
                <Input placeholder="Supplier" value={form.supplier} onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))} />
                <div className="md:col-span-2">
                    <Input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
                </div>
                <div className="flex gap-2 md:col-span-2 md:justify-end">
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
                        onClick={() => void createItem()}
                        disabled={isCreating}
                    >
                        <PlusIcon className="h-4 w-4" /> {isCreating ? 'Saving...' : 'Add Equipment'}
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                        onClick={() => {
                            setSearch('');
                            setSortField('name');
                            void loadEquipments();
                        }}
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                    </button>
                </div>
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
        </div>
    );
}
