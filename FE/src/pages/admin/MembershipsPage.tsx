import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusIcon, TrashIcon, PencilSquareIcon, ArrowPathIcon, ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';
import { membershipsApi, type Membership } from '../../api/membershipsApi';
import { paginate, queryIncludes } from '../../utils/table';
import { toApiError } from '../../api/httpClient';

export function MembershipsPage() {
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [openModal, setOpenModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Membership | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form Draft
    const [tierName, setTierName] = useState('');
    const [minPoints, setMinPoints] = useState<number | ''>('');
    const [discountPercent, setDiscountPercent] = useState<number | ''>('');

    const [isActive, setIsActive] = useState(true);

    const [sortField, setSortField] = useState<'minPoints' | 'discountPercent' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const loadMemberships = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await membershipsApi.getAll();
            setMemberships(data);
        } catch (error) {
            toast.error(toApiError(error).message || 'Failed to load memberships');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMemberships();
    }, [loadMemberships]);

    const handleSort = (field: 'minPoints' | 'discountPercent') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const filtered = useMemo(() => {
        let result = memberships.filter(item => queryIncludes(item.tierName, search));
        if (sortField) {
            result = [...result].sort((a, b) => {
                const valA = a[sortField] ?? 0;
                const valB = b[sortField] ?? 0;
                if (sortOrder === 'asc') return valA - valB;
                return valB - valA;
            });
        }
        return result;
    }, [memberships, search, sortField, sortOrder]);

    const pageSize = 10;
    const paged = paginate(filtered, page, pageSize);

    const columns = [
        { key: 'tierName', label: 'Tier Name', render: (row: Membership) => <span className="font-semibold text-slate-800">{row.tierName}</span> },
        { key: 'minPoints', label: (
            <div className="cursor-pointer flex items-center gap-1 hover:text-cyan-700 select-none group" onClick={() => handleSort('minPoints')}>
                Min Points 
                {sortField === 'minPoints' ? (
                    sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                ) : (
                    <ChevronUpDownIcon className="h-4 w-4 text-slate-300 group-hover:text-cyan-500" />
                )}
            </div>
        ) as any, render: (row: Membership) => row.minPoints ?? '-' },
        { key: 'discountPercent', label: (
            <div className="cursor-pointer flex items-center gap-1 hover:text-cyan-700 select-none group" onClick={() => handleSort('discountPercent')}>
                Discount 
                {sortField === 'discountPercent' ? (
                    sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                ) : (
                    <ChevronUpDownIcon className="h-4 w-4 text-slate-300 group-hover:text-cyan-500" />
                )}
            </div>
        ) as any, render: (row: Membership) => row.discountPercent ? `${row.discountPercent}%` : '-' },
        { key: 'status', label: 'Status', render: (row: Membership) => (
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                {row.isActive ? 'Active' : 'Inactive'}
            </span>
        ) },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: Membership) => (
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="rounded hover:text-cyan-700 text-slate-500"
                        onClick={() => openEdit(row)}
                        title="Edit"
                    >
                        <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        className="rounded hover:text-red-700 text-slate-500"
                        onClick={() => handleDelete(row.id)}
                        title="Delete"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            )
        }
    ];

    const openCreate = () => {
        setEditingItem(null);
        setTierName('');
        setMinPoints('');
        setDiscountPercent('');
        setIsActive(true);
        setOpenModal(true);
    };

    const openEdit = (item: Membership) => {
        setEditingItem(item);
        setTierName(item.tierName);
        setMinPoints(item.minPoints ?? '');
        setDiscountPercent(item.discountPercent ?? '');
        setIsActive(item.isActive ?? true);
        setOpenModal(true);
    };

    const handleSave = async () => {
        if (!tierName.trim()) {
            toast.error('Tier name is required');
            return;
        }

        setIsSaving(true);
        try {
            const data = {
                tierName: tierName.trim(),
                minPoints: minPoints === '' ? undefined : Number(minPoints),
                discountPercent: discountPercent === '' ? undefined : Number(discountPercent),
                isActive
            };

            if (editingItem) {
                await membershipsApi.update(editingItem.id, data);
                toast.success('Membership updated successfully');
            } else {
                await membershipsApi.create(data);
                toast.success('Membership created successfully');
            }
            setOpenModal(false);
            void loadMemberships();
        } catch (error) {
            toast.error(toApiError(error).message || 'Failed to save membership');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this membership?')) return;
        try {
            await membershipsApi.delete(id);
            toast.success('Membership deleted');
            void loadMemberships();
        } catch (error) {
            toast.error(toApiError(error).message || 'Failed to delete membership');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Memberships</h2>
                    <p className="text-sm text-slate-500">Manage membership tiers and discount rules.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={loadMemberships}
                        className="p-2 text-slate-500 hover:text-cyan-700 hover:bg-slate-100 rounded-full transition-colors"
                        title="Refresh"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
                    >
                        <PlusIcon className="h-4 w-4" /> Add Membership
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
                <div className="w-full max-w-sm">
                    <Input
                        placeholder="Search tier name..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                    Loading memberships...
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                    No memberships found.
                </div>
            ) : (
                <>
                    <Table columns={columns} rows={paged} />
                    <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
                </>
            )}

            <Modal
                title={editingItem ? 'Edit Membership' : 'Add Membership'}
                open={openModal}
                onClose={() => setOpenModal(false)}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Tier Name <span className="text-red-500">*</span></label>
                        <Input value={tierName} onChange={(e) => setTierName(e.target.value)} placeholder="e.g. Gold" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Minimum Points</label>
                        <Input type="number" min="0" value={minPoints} onChange={(e) => setMinPoints(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 1000" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Discount Percent (%)</label>
                        <Input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 10" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <label className="flex items-center gap-2 pt-2 cursor-pointer">
                            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-slate-300" />
                            <span className="text-sm text-slate-700">{isActive ? 'Active (Visible)' : 'Inactive'}</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setOpenModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
                        <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
