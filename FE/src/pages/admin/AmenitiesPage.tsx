import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PencilSquareIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { amenitiesApi, type AmenityItem } from '../../api/amenitiesApi';
import { toApiError } from '../../api/httpClient';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { Badge } from '../../components/Badge';

export function AmenitiesPage() {
    const { ensure } = usePermissionCheck();
    const [rows, setRows] = useState<AmenityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [createName, setCreateName] = useState('');
    const [createFile, setCreateFile] = useState<File | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);

    const [editing, setEditing] = useState<AmenityItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editFile, setEditFile] = useState<File | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const loadAmenities = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await amenitiesApi.getAll();
            setRows(data);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load amenities');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAmenities();
    }, [loadAmenities]);

    const createAmenity = async () => {
        if (!ensure('MANAGE_AMENITY', 'create amenity')) {
            return false;
        }

        if (!createName.trim()) {
            toast.error('Amenity name is required');
            return false;
        }

        setIsCreating(true);
        try {
            await amenitiesApi.create({
                name: createName.trim(),
                file: createFile,
            });
            toast.success('Amenity created');
            setCreateName('');
            setCreateFile(null);
            await loadAmenities();
            return true;
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to create amenity');
            return false;
        } finally {
            setIsCreating(false);
        }
    };

    const saveEdit = async () => {
        if (!editing) {
            return;
        }

        if (!ensure('MANAGE_AMENITY', 'update amenity')) {
            return;
        }

        if (!editName.trim()) {
            toast.error('Amenity name is required');
            return;
        }

        setIsSavingEdit(true);
        try {
            await amenitiesApi.update(editing.id, {
                name: editName.trim(),
                iconUrl: editing.iconUrl,
                file: editFile,
            });
            toast.success('Amenity updated');
            setEditing(null);
            setEditName('');
            setEditFile(null);
            await loadAmenities();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to update amenity');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const toggleAmenityActive = async (item: AmenityItem) => {
        if (!ensure('MANAGE_AMENITY', 'toggle amenity active status')) {
            return;
        }

        try {
            await amenitiesApi.toggleActive(item.id);
            setRows((prev) =>
                prev.map((row) =>
                    row.id === item.id
                        ? {
                            ...row,
                            isActive: !row.isActive,
                        }
                        : row,
                ),
            );
            toast.success(`${item.name} is now ${item.isActive ? 'OFF' : 'ON'}`);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to toggle amenity status');
        }
    };

    const columns = [
        {
            key: 'icon',
            label: 'Icon',
            render: (row: AmenityItem) =>
                row.iconUrl ? (
                    <img src={row.iconUrl} alt={row.name} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
                ) : (
                    <div className="h-10 w-10 rounded-lg border border-dashed border-slate-300" />
                ),
        },
        { key: 'name', label: 'Name', render: (row: AmenityItem) => row.name },
        {
            key: 'status',
            label: 'Status',
            render: (row: AmenityItem) => (
                <button
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                        void toggleAmenityActive(row);
                    }}
                >
                    <Badge value={row.isActive ? 'Active' : 'Inactive'} />
                </button>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: AmenityItem) => (
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        onClick={() => {
                            setEditing(row);
                            setEditName(row.name);
                            setEditFile(null);
                        }}
                    >
                        <PencilSquareIcon className="h-4 w-4" /> Edit
                    </button>
                    {/* <button
                        type="button"
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${row.isActive ? 'border-amber-200 text-amber-700' : 'border-emerald-200 text-emerald-700'}`}
                        onClick={() => {
                            void toggleAmenityActive(row);
                        }}
                    >
                        {row.isActive ? 'Set OFF' : 'Set ON'}
                    </button> */}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Amenities</h2>
                    <p className="text-sm text-slate-500">Manage amenity catalog and icon image for room setup.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => void loadAmenities()}
                        className="p-2 text-slate-500 hover:text-cyan-600 transition bg-white border border-slate-200 rounded-xl"
                        title="Refresh"
                    >
                        <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
                        onClick={() => setOpenCreate(true)}
                    >
                        <PlusIcon className="h-4 w-4" /> Add Amenity
                    </button>
                </div>
            </div>

            <Table columns={columns} rows={isLoading ? [] : rows} />

            <Modal
                open={openCreate}
                title="Add Amenity"
                onClose={() => {
                    setOpenCreate(false);
                    setCreateName('');
                    setCreateFile(null);
                }}
            >
                <div className="space-y-4">
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Amenity details</h3>
                            <p className="text-xs text-slate-500">Enter the display name and optional icon image.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Amenity name</label>
                            <Input placeholder="Example: Free Wi-Fi" value={createName} onChange={(event) => setCreateName(event.target.value)} />
                            <p className="text-xs text-slate-500">Shown in room types and room setup screens.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Icon image</label>
                            <Input type="file" accept="image/*" onChange={(event) => setCreateFile(event.target.files?.[0] ?? null)} />
                            <p className="text-xs text-slate-500">Upload a small image for visual identification.</p>
                        </div>
                    </section>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            onClick={() => {
                                setOpenCreate(false);
                                setCreateName('');
                                setCreateFile(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            onClick={() =>
                                void (async () => {
                                    const created = await createAmenity();
                                    if (created) {
                                        setOpenCreate(false);
                                    }
                                })()
                            }
                            disabled={isCreating}
                        >
                            {isCreating ? 'Saving...' : 'Save Amenity'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={Boolean(editing)}
                title={editing ? `Edit Amenity: ${editing.name}` : 'Edit Amenity'}
                onClose={() => {
                    setEditing(null);
                    setEditName('');
                    setEditFile(null);
                }}
            >
                <div className="space-y-4">
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Amenity details</h3>
                            <p className="text-xs text-slate-500">Update display name and icon image for this amenity.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Amenity name</label>
                            <Input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Example: Free Wi-Fi" />
                            <p className="text-xs text-slate-500">Shown in room types and booking-related screens.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Current icon</label>
                            {editing?.iconUrl ? (
                                <img src={editing.iconUrl} alt={editing.name} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                            ) : (
                                <div className="h-16 w-16 rounded-lg border border-dashed border-slate-300 bg-white" />
                            )}
                            <p className="text-xs text-slate-500">If no new image is selected, the current icon is kept.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Replace icon image</label>
                            <Input type="file" accept="image/*" onChange={(event) => setEditFile(event.target.files?.[0] ?? null)} />
                            <p className="text-xs text-slate-500">Upload only when you want to change the existing icon.</p>
                        </div>
                    </section>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            onClick={() => {
                                setEditing(null);
                                setEditName('');
                                setEditFile(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            onClick={() => void saveEdit()}
                            disabled={isSavingEdit}
                        >
                            {isSavingEdit ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
