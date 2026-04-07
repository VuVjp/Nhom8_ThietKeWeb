import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { toApiError } from '../../api/httpClient';
import { membershipsApi, MembershipItem } from '../../api/membershipsApi';
import { Modal } from '../../components/Modal';
import { Table } from '../../components/Table';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Pagination } from '../../components/Pagination';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { useOutletContext } from 'react-router-dom';
import type { LayoutOutletContext } from '../../types/layout';
import { paginate, queryIncludes, sortBy } from '../../utils/table';

export function MembershipsPage() {
    const { ensure } = usePermissionCheck();
    const outletContext = useOutletContext<LayoutOutletContext>();
    const globalSearch = outletContext?.globalSearch ?? '';
    
    const [memberships, setMemberships] = useState<MembershipItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    
    const [sortMode, setSortMode] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(1);
    const pageSize = 8;
    
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [draftTierName, setDraftTierName] = useState('');
    const [draftMinPoints, setDraftMinPoints] = useState<number>(0);
    const [draftDiscountPercent, setDraftDiscountPercent] = useState<number>(0);

    const loadMemberships = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await membershipsApi.getAll();
            setMemberships(data);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load memberships');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMemberships();
    }, [loadMemberships]);
    
    const filtered = useMemo(() => {
        let rows = memberships.filter((item) => {
            return queryIncludes(item.tierName, globalSearch);
        });
        
        rows = sortBy(rows, (row) => row.minPoints ?? 0, sortMode);
        return rows;
    }, [memberships, globalSearch, sortMode]);
    
    const paged = paginate(filtered, page, pageSize);

    const handleCreate = async () => {
        if (!ensure('MANAGE_MEMBERSHIPS', 'create membership')) return;
        if (!draftTierName.trim()) {
            toast.error('Tier name is required');
            return;
        }

        try {
            await membershipsApi.create({
                tierName: draftTierName,
                minPoints: draftMinPoints,
                discountPercent: draftDiscountPercent
            });
            toast.success('Membership created');
            setOpenAdd(false);
            void loadMemberships();
        } catch (error) {
            toast.error(toApiError(error).message || 'Failed to create membership');
        }
    };

    const handleEdit = async () => {
        if (!ensure('MANAGE_MEMBERSHIPS', 'edit membership')) return;
        if (selectedId === null) return;
        if (!draftTierName.trim()) {
            toast.error('Tier name is required');
            return;
        }

        try {
            await membershipsApi.update(selectedId, {
                tierName: draftTierName,
                minPoints: draftMinPoints,
                discountPercent: draftDiscountPercent
            });
            toast.success('Membership updated');
            setOpenEdit(false);
            void loadMemberships();
        } catch (error) {
            toast.error(toApiError(error).message || 'Failed to update membership');
        }
    };

    const handleDelete = async (id: number) => {
        if (!ensure('MANAGE_MEMBERSHIPS', 'delete membership')) return;
        if (!confirm('Are you sure you want to delete this membership?')) return;

        try {
            await membershipsApi.remove(id);
            toast.success('Membership deleted');
            void loadMemberships();
        } catch (error) {
            toast.error(toApiError(error).message || 'Failed to delete membership');
        }
    };

    const openEditModal = (item: MembershipItem) => {
        setSelectedId(item.id);
        setDraftTierName(item.tierName);
        setDraftMinPoints(item.minPoints || 0);
        setDraftDiscountPercent(item.discountPercent || 0);
        setOpenEdit(true);
    };

    const openCreateModal = () => {
        setDraftTierName('');
        setDraftMinPoints(0);
        setDraftDiscountPercent(0);
        setOpenAdd(true);
    };

    const columns = [
        { key: 'tierName', label: 'Tier Name', render: (row: MembershipItem) => <span className="font-medium text-slate-800">{row.tierName}</span> },
        { key: 'minPoints', label: 'Minimum Points Required', render: (row: MembershipItem) => <span className="text-cyan-700 font-semibold">{row.minPoints?.toLocaleString() ?? 0} pts</span> },
        { key: 'discountPercent', label: 'Discount Benefit (%)', render: (row: MembershipItem) => <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-medium text-emerald-700">{row.discountPercent}%</span> },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: MembershipItem) => (
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:text-cyan-700 hover:bg-cyan-50"
                        onClick={() => openEditModal(row)}
                    >
                        <PencilIcon className="h-4 w-4" /> Edit
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(row.id)}
                    >
                        <TrashIcon className="h-4 w-4" /> Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Memberships</h2>
                    <p className="text-sm text-slate-500">Manage member rating tiers, required points and discount policies.</p>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
                    onClick={openCreateModal}
                >
                    <PlusIcon className="h-4 w-4" /> Create Tier
                </button>
            </div>
            
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4">
                <Select value={sortMode} onChange={(e) => setSortMode(e.target.value as 'asc' | 'desc')}>
                    <option value="asc">Sort By Points (Low to High)</option>
                    <option value="desc">Sort By Points (High to Low)</option>
                </Select>
            </div>

            {isLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                    Loading memberships...
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                    {memberships.length === 0 ? 'No membership tiers found' : 'No results match your filters'}
                </div>
            ) : (
                <>
                    <Table columns={columns} rows={paged} />
                    <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
                </>
            )}

            <Modal open={openAdd} title="Create Membership Tier" onClose={() => setOpenAdd(false)}>
                <div className="space-y-4">
                    <Input label="Tier Name" value={draftTierName} onChange={(e) => setDraftTierName(e.target.value)} placeholder="e.g. Gold" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Minimum Points" type="number" value={draftMinPoints.toString()} onChange={(e) => setDraftMinPoints(Number(e.target.value))} />
                        <Input label="Discount Percent (%)" type="number" step="0.01" value={draftDiscountPercent.toString()} onChange={(e) => setDraftDiscountPercent(Number(e.target.value))} />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50" onClick={() => setOpenAdd(false)}>Cancel</button>
                        <button type="button" className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 transition" onClick={handleCreate}>Create Tier</button>
                    </div>
                </div>
            </Modal>

            <Modal open={openEdit} title="Edit Membership Tier" onClose={() => setOpenEdit(false)}>
                <div className="space-y-4">
                    <Input label="Tier Name" value={draftTierName} onChange={(e) => setDraftTierName(e.target.value)} placeholder="e.g. Gold" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Minimum Points" type="number" value={draftMinPoints.toString()} onChange={(e) => setDraftMinPoints(Number(e.target.value))} />
                        <Input label="Discount Percent (%)" type="number" step="0.01" value={draftDiscountPercent.toString()} onChange={(e) => setDraftDiscountPercent(Number(e.target.value))} />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50" onClick={() => setOpenEdit(false)}>Cancel</button>
                        <button type="button" className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 transition" onClick={handleEdit}>Save Requirements</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
