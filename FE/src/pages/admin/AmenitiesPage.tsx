import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { amenitiesApi, type AmenityItem } from '../../api/amenitiesApi';
import { toApiError } from '../../api/httpClient';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

export function AmenitiesPage() {
    const { ensure } = usePermissionCheck();
    const [rows, setRows] = useState<AmenityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [createName, setCreateName] = useState('');
    const [createFile, setCreateFile] = useState<File | null>(null);
    const [isCreating, setIsCreating] = useState(false);

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
        if (!ensure('create_amenity', 'create amenity')) {
            return;
        }

        if (!createName.trim()) {
            toast.error('Amenity name is required');
            return;
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
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to create amenity');
        } finally {
            setIsCreating(false);
        }
    };

    const saveEdit = async () => {
        if (!editing) {
            return;
        }

        if (!ensure('update_amenity', 'update amenity')) {
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

    const removeAmenity = async (item: AmenityItem) => {
        if (!ensure('delete_amenity', 'delete amenity')) {
            return;
        }

        try {
            await amenitiesApi.remove(item.id);
            setRows((prev) => prev.filter((row) => row.id !== item.id));
            toast.success(`Deleted ${item.name}`);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to delete amenity');
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
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                        onClick={() => {
                            void removeAmenity(row);
                        }}
                    >
                        <TrashIcon className="h-4 w-4" /> Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Amenities</h2>
                <p className="text-sm text-slate-500">Manage amenity catalog and icon image for room setup.</p>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
                <Input
                    placeholder="Amenity name"
                    value={createName}
                    onChange={(event) => setCreateName(event.target.value)}
                />
                <Input type="file" accept="image/*" onChange={(event) => setCreateFile(event.target.files?.[0] ?? null)} />
                <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
                    onClick={() => void createAmenity()}
                    disabled={isCreating}
                >
                    <PlusIcon className="h-4 w-4" /> {isCreating ? 'Saving...' : 'Add Amenity'}
                </button>
            </div>

            <Table columns={columns} rows={isLoading ? [] : rows} />

            <Modal
                open={Boolean(editing)}
                title={editing ? `Edit Amenity: ${editing.name}` : 'Edit Amenity'}
                onClose={() => {
                    setEditing(null);
                    setEditName('');
                    setEditFile(null);
                }}
            >
                <div className="space-y-3">
                    <Input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Amenity name" />
                    <Input type="file" accept="image/*" onChange={(event) => setEditFile(event.target.files?.[0] ?? null)} />
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
