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
    const [openAddQuantity, setOpenAddQuantity] = useState(false);
    const [selectedEquipmentForQuantity, setSelectedEquipmentForQuantity] = useState<EquipmentItem | null>(null);
    const [quantityToAdd, setQuantityToAdd] = useState('0');
    const [isAddingQuantity, setIsAddingQuantity] = useState(false);

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

    const handleAddQuantity = (equipment: EquipmentItem) => {
        if (!ensure('MANAGE_EQUIPMENTS', 'add equipment quantity')) {
            return;
        }
        if (!equipment.isActive) {
            toast.error('Cannot add quantity while equipment is OFF');
            return;
        }
        setSelectedEquipmentForQuantity(equipment);
        setQuantityToAdd('0');
        setOpenAddQuantity(true);
    };

    const handleSaveAddQuantity = async () => {
        if (!selectedEquipmentForQuantity || !quantityToAdd) {
            toast.error('Please enter quantity to add');
            return;
        }

        const qtyToAdd = Number(quantityToAdd);
        if (qtyToAdd <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }

        setIsAddingQuantity(true);
        try {
            await equipmentsApi.update(selectedEquipmentForQuantity.id, {

                totalQuantity: selectedEquipmentForQuantity.totalQuantity + qtyToAdd,
            });
            toast.success(`Added ${qtyToAdd} units to ${selectedEquipmentForQuantity.name}`);
            setOpenAddQuantity(false);
            void loadEquipments();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to add quantity');
        } finally {
            setIsAddingQuantity(false);
        }
    };

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
            key: 'status',
            label: 'Status',
            render: (row: EquipmentItem) => (
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {row.isActive ? 'ON' : 'OFF'}
                </span>
            ),
        },
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
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="rounded-lg border border-cyan-200 px-2 py-1 text-xs text-cyan-600 hover:bg-cyan-50"
                        onClick={() => handleAddQuantity(row)}
                        disabled={!row.isActive}
                    >
                        Add Quantity
                    </button>
                    <button
                        type="button"
                        className={`rounded-lg border px-2 py-1 text-xs ${row.isActive ? 'border-amber-200 text-amber-700' : 'border-emerald-200 text-emerald-700'}`}
                        onClick={() => {
                            if (!ensure('MANAGE_EQUIPMENTS', 'toggle equipment active status')) {
                                return;
                            }

                            void (async () => {
                                try {
                                    await equipmentsApi.toggleActive(row.id);
                                    setRows((prev) =>
                                        prev.map((item) =>
                                            item.id === row.id
                                                ? {
                                                    ...item,
                                                    isActive: !item.isActive,
                                                }
                                                : item,
                                        ),
                                    );
                                    toast.success(`${row.itemCode} is now ${row.isActive ? 'OFF' : 'ON'}`);
                                } catch (error) {
                                    const apiError = toApiError(error);
                                    toast.error(apiError.message || 'Failed to toggle equipment status');
                                }
                            })();
                        }}
                    >
                        {row.isActive ? 'Set OFF' : 'Set ON'}
                    </button>
                </div>
            ),
        },
    ];

    const createItem = async (): Promise<boolean> => {
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

            <Modal
                open={openAddQuantity}
                title={selectedEquipmentForQuantity ? `Add Quantity - ${selectedEquipmentForQuantity.name}` : 'Add Quantity'}
                onClose={() => setOpenAddQuantity(false)}
            >
                {selectedEquipmentForQuantity && (
                    <div className="space-y-4">
                        <div className="rounded-lg bg-slate-50 p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Current Total:</span>
                                <span className="font-bold text-cyan-700">
                                    {selectedEquipmentForQuantity.totalQuantity} {selectedEquipmentForQuantity.unit}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">In Use:</span>
                                <span className="font-medium">{selectedEquipmentForQuantity.inUseQuantity}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Damaged:</span>
                                <span className="font-medium">{selectedEquipmentForQuantity.damagedQuantity}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Quantity to Add</label>
                            <Input
                                type="number"
                                min="1"
                                value={quantityToAdd}
                                onChange={(e) => setQuantityToAdd(e.target.value)}
                                placeholder="Enter quantity to add"
                            />
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                            <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                onClick={() => setOpenAddQuantity(false)}
                                disabled={isAddingQuantity}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800 disabled:opacity-50"
                                onClick={handleSaveAddQuantity}
                                disabled={isAddingQuantity || !quantityToAdd}
                            >
                                {isAddingQuantity ? 'Adding...' : 'Add Quantity'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
