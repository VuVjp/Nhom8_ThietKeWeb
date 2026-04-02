import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { roomTypesApi, type RoomTypeItem, type RoomTypePayload } from '../../api/roomTypesApi';
import { amenitiesApi, type AmenityItem } from '../../api/amenitiesApi';
import { toApiError } from '../../api/httpClient';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

const emptyDraft: RoomTypePayload = {
    name: '',
    basePrice: 0,
    capacityAdults: 1,
    capacityChildren: 0,
    description: '',
};

export function RoomTypesPage() {
    const { ensure } = usePermissionCheck();
    const [rows, setRows] = useState<RoomTypeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [draft, setDraft] = useState<RoomTypePayload>(emptyDraft);
    const [isCreating, setIsCreating] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [editing, setEditing] = useState<RoomTypeItem | null>(null);
    const [editDraft, setEditDraft] = useState<RoomTypePayload>(emptyDraft);
    const [isSaving, setIsSaving] = useState(false);
    const [amenityOptions, setAmenityOptions] = useState<AmenityItem[]>([]);
    const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);

    const loadRoomTypes = useCallback(async () => {
        setIsLoading(true);
        try {
            const [roomTypeData, amenityData] = await Promise.all([roomTypesApi.getAll(), amenitiesApi.getAll()]);
            setRows(roomTypeData);
            setAmenityOptions(amenityData);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load room types');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadRoomTypes();
    }, [loadRoomTypes]);

    const createRoomType = async () => {
        if (!ensure('manage_room_type', 'create room type')) {
            return false;
        }

        if (!draft.name.trim()) {
            toast.error('Room type name is required');
            return false;
        }

        setIsCreating(true);
        try {
            await roomTypesApi.create({
                name: draft.name.trim(),
                basePrice: Number(draft.basePrice),
                capacityAdults: Number(draft.capacityAdults),
                capacityChildren: Number(draft.capacityChildren),
                description: draft.description?.trim() || '',
            });
            toast.success('Room type created');
            setDraft(emptyDraft);
            await loadRoomTypes();
            return true;
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to create room type');
            return false;
        } finally {
            setIsCreating(false);
        }
    };

    const saveEdit = async (roomTypeId: number) => {
        if (!editDraft.name.trim()) {
            toast.error('Room type name is required');
            return false;
        }

        await roomTypesApi.update(roomTypeId, {
            name: editDraft.name.trim(),
            basePrice: Number(editDraft.basePrice),
            capacityAdults: Number(editDraft.capacityAdults),
            capacityChildren: Number(editDraft.capacityChildren),
            description: editDraft.description?.trim() || '',
        });

        return true;
    };

    const saveAmenities = async (roomTypeId: number, currentAmenityIds: number[], nextAmenityIds: number[]) => {
        const currentSet = new Set(currentAmenityIds);
        const nextSet = new Set(nextAmenityIds);

        const addedAmenityIds = nextAmenityIds.filter((amenityId) => !currentSet.has(amenityId));
        const removedAmenityIds = currentAmenityIds.filter((amenityId) => !nextSet.has(amenityId));

        if (addedAmenityIds.length > 0) {
            await roomTypesApi.addAmenities(roomTypeId, addedAmenityIds);
        }

        if (removedAmenityIds.length > 0) {
            await Promise.all(removedAmenityIds.map((amenityId) => roomTypesApi.removeAmenity(roomTypeId, amenityId)));
        }
    };

    const deleteRoomType = async (item: RoomTypeItem) => {
        if (!ensure('manage_room_type', 'delete room type')) {
            return;
        }

        try {
            await roomTypesApi.remove(item.id);
            setRows((prev) => prev.filter((row) => row.id !== item.id));
            toast.success('Room type deleted');
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to delete room type');
        }
    };

    const openEdit = (row: RoomTypeItem) => {
        setEditing(row);
        setEditDraft({
            name: row.name,
            basePrice: row.basePrice,
            capacityAdults: row.capacityAdults,
            capacityChildren: row.capacityChildren,
            description: row.description,
        });
        setSelectedAmenityIds(row.amenities.map((amenity) => amenity.id));
    };

    const columns = [
        { key: 'name', label: 'Name', render: (row: RoomTypeItem) => row.name },
        { key: 'basePrice', label: 'Base Price', render: (row: RoomTypeItem) => `$${row.basePrice}` },
        { key: 'capacityAdults', label: 'Adults', render: (row: RoomTypeItem) => row.capacityAdults },
        { key: 'capacityChildren', label: 'Children', render: (row: RoomTypeItem) => row.capacityChildren },
        { key: 'description', label: 'Description', render: (row: RoomTypeItem) => row.description || '-' },
        {
            key: 'amenities',
            label: 'Amenities',
            render: (row: RoomTypeItem) =>
                row.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {row.amenities.map((amenity) => (
                            <span key={amenity.id} className="rounded-full bg-cyan-50 px-2 py-1 text-xs text-cyan-700">
                                {amenity.name}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-slate-400">-</span>
                ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: RoomTypeItem) => (
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        onClick={() => openEdit(row)}
                    >
                        <PencilSquareIcon className="h-4 w-4" /> Edit
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                        onClick={() => {
                            void deleteRoomType(row);
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
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Room Types</h2>
                    <p className="text-sm text-slate-500">Add and manage room type definitions for room creation.</p>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
                    onClick={() => setOpenCreate(true)}
                >
                    <PlusIcon className="h-4 w-4" /> Add Room Type
                </button>
            </div>

            <Table columns={columns} rows={isLoading ? [] : rows} />

            <Modal
                open={openCreate}
                title="Add Room Type"
                onClose={() => {
                    setOpenCreate(false);
                    setDraft(emptyDraft);
                }}
            >
                <div className="space-y-5">
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Basic information</h3>
                            <p className="text-xs text-slate-500">Enter the room type name and a short description.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Room type name</label>
                            <Input placeholder="Example: Deluxe Sea View" value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
                            <p className="text-xs text-slate-500">This name is shown when creating rooms.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <Input placeholder="Example: Large room with balcony" value={draft.description ?? ''} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} />
                            <p className="text-xs text-slate-500">Describe the room style or selling point.</p>
                        </div>
                    </section>

                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Pricing and capacity</h3>
                            <p className="text-xs text-slate-500">Set base price and guest capacity values.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Base price</label>
                                <Input type="number" min={0} step="0.01" placeholder="0" value={String(draft.basePrice)} onChange={(event) => setDraft((prev) => ({ ...prev, basePrice: Number(event.target.value) }))} />
                                <p className="text-xs text-slate-500">Nightly price for this room type.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Adults</label>
                                <Input type="number" min={0} placeholder="1" value={String(draft.capacityAdults)} onChange={(event) => setDraft((prev) => ({ ...prev, capacityAdults: Number(event.target.value) }))} />
                                <p className="text-xs text-slate-500">Max adult guests.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Children</label>
                                <Input type="number" min={0} placeholder="0" value={String(draft.capacityChildren)} onChange={(event) => setDraft((prev) => ({ ...prev, capacityChildren: Number(event.target.value) }))} />
                                <p className="text-xs text-slate-500">Max child guests.</p>
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            onClick={() => {
                                setOpenCreate(false);
                                setDraft(emptyDraft);
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            onClick={() =>
                                void (async () => {
                                    const created = await createRoomType();
                                    if (created) {
                                        setOpenCreate(false);
                                    }
                                })()
                            }
                            disabled={isCreating}
                        >
                            {isCreating ? 'Saving...' : 'Save Room Type'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={Boolean(editing)}
                title={editing ? `Edit Room Type: ${editing.name}` : 'Edit Room Type'}
                onClose={() => {
                    setEditing(null);
                    setEditDraft(emptyDraft);
                    setSelectedAmenityIds([]);
                }}
            >
                <div className="space-y-5">
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Basic information</h3>
                            <p className="text-xs text-slate-500">Enter the room type name and short description.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Room type name</label>
                            <Input placeholder="Example: Deluxe Sea View" value={editDraft.name} onChange={(event) => setEditDraft((prev) => ({ ...prev, name: event.target.value }))} />
                            <p className="text-xs text-slate-500">This name appears in room creation and room lists.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <Input placeholder="Example: Large room with balcony" value={editDraft.description ?? ''} onChange={(event) => setEditDraft((prev) => ({ ...prev, description: event.target.value }))} />
                            <p className="text-xs text-slate-500">Describe what makes this room type different.</p>
                        </div>
                    </section>

                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Pricing and capacity</h3>
                            <p className="text-xs text-slate-500">Set the base price and guest capacity values.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Base price</label>
                                <Input type="number" min={0} step="0.01" placeholder="0" value={String(editDraft.basePrice)} onChange={(event) => setEditDraft((prev) => ({ ...prev, basePrice: Number(event.target.value) }))} />
                                <p className="text-xs text-slate-500">Used for pricing a room of this type.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Adults</label>
                                <Input type="number" min={0} placeholder="1" value={String(editDraft.capacityAdults)} onChange={(event) => setEditDraft((prev) => ({ ...prev, capacityAdults: Number(event.target.value) }))} />
                                <p className="text-xs text-slate-500">Maximum adult guests.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Children</label>
                                <Input type="number" min={0} placeholder="0" value={String(editDraft.capacityChildren)} onChange={(event) => setEditDraft((prev) => ({ ...prev, capacityChildren: Number(event.target.value) }))} />
                                <p className="text-xs text-slate-500">Maximum child guests.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Amenities</h3>
                            <p className="text-xs text-slate-500">Check amenities included in this room type.</p>
                        </div>
                        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                            {amenityOptions.map((amenity) => {
                                const checked = selectedAmenityIds.includes(amenity.id);
                                return (
                                    <label key={amenity.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(event) => {
                                                if (event.target.checked) {
                                                    setSelectedAmenityIds((prev) => Array.from(new Set([...prev, amenity.id])));
                                                } else {
                                                    setSelectedAmenityIds((prev) => prev.filter((id) => id !== amenity.id));
                                                }
                                            }}
                                        />
                                        <span className="flex-1">{amenity.name}</span>
                                        {amenity.iconUrl ? <img src={amenity.iconUrl} alt={amenity.name} className="h-8 w-8 rounded object-cover" /> : null}
                                    </label>
                                );
                            })}
                            {amenityOptions.length === 0 ? <p className="text-sm text-slate-500">No amenities found.</p> : null}
                        </div>
                    </section>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            onClick={() => {
                                setEditing(null);
                                setEditDraft(emptyDraft);
                                setSelectedAmenityIds([]);
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            onClick={() =>
                                void (async () => {
                                    if (!editing) {
                                        return;
                                    }

                                    if (!ensure('manage_room_type', 'update room type')) {
                                        return;
                                    }

                                    try {
                                        setIsSaving(true);
                                        const currentAmenityIds = editing.amenities.map((item) => item.id);
                                        await saveEdit(editing.id);
                                        await saveAmenities(editing.id, currentAmenityIds, selectedAmenityIds);

                                        toast.success('Room type and amenities updated');
                                        setEditing(null);
                                        setEditDraft(emptyDraft);
                                        setSelectedAmenityIds([]);
                                        await loadRoomTypes();
                                    } catch (error) {
                                        const apiError = toApiError(error);
                                        toast.error(apiError.message || 'Failed to update room type amenities');
                                    } finally {
                                        setIsSaving(false);
                                    }
                                })()
                            }
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
