import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { toApiError } from '../../api/httpClient';
import { attractionsApi, AttractionItem } from '../../api/attractionsApi';
import { Modal } from '../../components/Modal';
import { Table } from '../../components/Table';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Pagination } from '../../components/Pagination';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { useOutletContext } from 'react-router-dom';
import type { LayoutOutletContext } from '../../types/layout';
import { paginate, queryIncludes, sortBy } from '../../utils/table';

export function AttractionsPage() {
    const { ensure } = usePermissionCheck();
    const outletContext = useOutletContext<LayoutOutletContext>();
    const globalSearch = outletContext?.globalSearch ?? '';
    
    const [attractions, setAttractions] = useState<AttractionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    
    const [sortMode, setSortMode] = useState<'asc' | 'desc'>('asc');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const pageSize = 8;
    
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [draftName, setDraftName] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [draftDistanceKm, setDraftDistanceKm] = useState<number>(0);
    const [draftLatitude, setDraftLatitude] = useState('');
    const [draftLongitude, setDraftLongitude] = useState('');
    const [draftIsActive, setDraftIsActive] = useState(true);

    const loadAttractions = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await attractionsApi.getAll();
            setAttractions(data);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load attractions');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAttractions();
    }, [loadAttractions]);

    const filtered = useMemo(() => {
        let rows = attractions.filter((item) => {
            const matchesSearch = queryIncludes(item.name, globalSearch) || queryIncludes(item.description || '', globalSearch);
            const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? item.isActive : !item.isActive;
            return matchesSearch && matchesStatus;
        });
        
        rows = sortBy(rows, (row) => row.distanceKm ?? 0, sortMode);
        return rows;
    }, [attractions, globalSearch, sortMode, statusFilter]);
    
    const paged = paginate(filtered, page, pageSize);

    const handleCreate = async () => {
        if (!ensure('MANAGE_ATTRACTIONS', 'create attraction')) return;
        if (!draftName.trim() || !draftLatitude.trim() || !draftLongitude.trim()) {
            toast.error('Name, Latitude, and Longitude are required');
            return;
        }

        try {
            await attractionsApi.create({
                name: draftName,
                description: draftDescription,
                distanceKm: draftDistanceKm,
                latitude: draftLatitude,
                longitude: draftLongitude
            });
            toast.success('Attraction created');
            setOpenAdd(false);
            void loadAttractions();
        } catch (error) {
            toast.error(toApiError(error).message || 'Failed to create attraction');
        }
    };

    const handleEdit = async () => {
        if (!ensure('MANAGE_ATTRACTIONS', 'edit attraction')) return;
        if (selectedId === null) return;
        if (!draftName.trim() || !draftLatitude.trim() || !draftLongitude.trim()) {
            toast.error('Name, Latitude, and Longitude are required');
            return;
        }

        try {
            await attractionsApi.update(selectedId, {
                name: draftName,
                description: draftDescription,
                distanceKm: draftDistanceKm,
                latitude: draftLatitude,
                longitude: draftLongitude,
                isActive: draftIsActive
            });
            toast.success('Attraction updated');
            setOpenEdit(false);
            void loadAttractions();
        } catch (error) {
            toast.error(toApiError(error).message || 'Failed to update attraction');
        }
    };

    const handleDelete = async (id: number) => {
        if (!ensure('MANAGE_ATTRACTIONS', 'delete attraction')) return;
        if (!confirm('Are you sure you want to delete this attraction?')) return;

        try {
            await attractionsApi.remove(id);
            toast.success('Attraction deleted');
            void loadAttractions();
        } catch (error) {
            toast.error(toApiError(error).message || 'Failed to delete attraction');
        }
    };

    const openEditModal = (item: AttractionItem) => {
        setSelectedId(item.id);
        setDraftName(item.name);
        setDraftDescription(item.description || '');
        setDraftDistanceKm(item.distanceKm || 0);
        setDraftLatitude(item.latitude);
        setDraftLongitude(item.longitude);
        setDraftIsActive(item.isActive);
        setOpenEdit(true);
    };

    const openCreateModal = () => {
        setDraftName('');
        setDraftDescription('');
        setDraftDistanceKm(0);
        setDraftLatitude('');
        setDraftLongitude('');
        setDraftIsActive(true);
        setOpenAdd(true);
    };

    const columns = [
        { key: 'name', label: 'Name', render: (row: AttractionItem) => <span className="font-medium text-slate-800">{row.name}</span> },
        { 
            key: 'distanceKm', 
            label: 'Distance', 
            render: (row: AttractionItem) => (
                <span className="text-cyan-700 font-semibold">{row.distanceKm} km</span>
            ) 
        },
        { 
            key: 'coordinates', 
            label: 'Coordinates', 
            render: (row: AttractionItem) => (
                <span className="text-sm text-slate-500 font-mono tracking-tight">{row.latitude}, {row.longitude}</span>
            ) 
        },
        { 
            key: 'isActive', 
            label: 'Status', 
            render: (row: AttractionItem) => (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {row.isActive ? 'Active' : 'Inactive'}
                </span>
            ) 
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: AttractionItem) => (
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
                    <h2 className="text-2xl font-bold text-slate-900">Attractions</h2>
                    <p className="text-sm text-slate-500">Manage nearby tourist attractions and landmarks.</p>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
                    onClick={openCreateModal}
                >
                    <PlusIcon className="h-4 w-4" /> Add Attraction
                </button>
            </div>
            
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4">
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}>
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </Select>
                <Select value={sortMode} onChange={(e) => setSortMode(e.target.value as 'asc' | 'desc')}>
                    <option value="asc">Distance (Nearest First)</option>
                    <option value="desc">Distance (Farthest First)</option>
                </Select>
            </div>

            {isLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                    Loading attractions...
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                    {attractions.length === 0 ? 'No attractions found' : 'No results match your filters'}
                </div>
            ) : (
                <>
                    <Table columns={columns} rows={paged} />
                    <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
                </>
            )}

            <Modal open={openAdd} title="Add Attraction" onClose={() => setOpenAdd(false)}>
                <div className="space-y-4">
                    <Input label="Name" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Central Park" />
                    <Input label="Description" value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} placeholder="A short description of the place" />
                    <Input label="Distance (km) from Hotel" type="number" step="0.1" value={draftDistanceKm.toString()} onChange={(e) => setDraftDistanceKm(Number(e.target.value))} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Latitude" value={draftLatitude} onChange={(e) => setDraftLatitude(e.target.value)} placeholder="40.7829" />
                        <Input label="Longitude" value={draftLongitude} onChange={(e) => setDraftLongitude(e.target.value)} placeholder="-73.9654" />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50" onClick={() => setOpenAdd(false)}>Cancel</button>
                        <button type="button" className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 transition" onClick={handleCreate}>Create Attraction</button>
                    </div>
                </div>
            </Modal>

            <Modal open={openEdit} title="Edit Attraction" onClose={() => setOpenEdit(false)}>
                <div className="space-y-4">
                    <Input label="Name" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Central Park" />
                    <Input label="Description" value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} placeholder="A short description of the place" />
                    <Input label="Distance (km) from Hotel" type="number" step="0.1" value={draftDistanceKm.toString()} onChange={(e) => setDraftDistanceKm(Number(e.target.value))} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Latitude" value={draftLatitude} onChange={(e) => setDraftLatitude(e.target.value)} placeholder="40.7829" />
                        <Input label="Longitude" value={draftLongitude} onChange={(e) => setDraftLongitude(e.target.value)} placeholder="-73.9654" />
                    </div>
                    
                    <label className="flex items-center gap-2 text-sm pt-2 p-3 border border-slate-200 rounded-lg bg-slate-50">
                        <input type="checkbox" checked={draftIsActive} onChange={(e) => setDraftIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-600" />
                        <span className="font-medium text-slate-700">Display this attraction to guests (Active)</span>
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50" onClick={() => setOpenEdit(false)}>Cancel</button>
                        <button type="button" className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 transition" onClick={handleEdit}>Save Changes</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
