import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PencilSquareIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { roomTypesApi, type RoomTypeItem, type RoomTypePayload } from '../../api/roomTypesApi';
import { amenitiesApi, type AmenityItem } from '../../api/amenitiesApi';
import { toApiError } from '../../api/httpClient';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { Badge } from '../../components/Badge';
import { ImageUpload } from '../../components/ImageUpload';
import { PhotoIcon } from '@heroicons/react/24/outline';

const emptyDraft: RoomTypePayload = {
    Name: '',
    BasePrice: 0,
    CapacityAdults: 1,
    CapacityChildren: 0,
    Description: '',
    View: '',
    BedType: '',
    SizeM2: null,
    Files: [],
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
    const [createFiles, setCreateFiles] = useState<File[]>([]);
    const [createPrimaryIndex, setCreatePrimaryIndex] = useState<number | string>(0);
    const [editFiles, setEditFiles] = useState<File[]>([]);
    const [editActiveIndex, setEditActiveIndex] = useState<number | string>(0);
    const [viewAmenitiesTarget, setViewAmenitiesTarget] = useState<RoomTypeItem | null>(null);

    const getDefaultActiveImageId = (images: RoomTypeItem['images']) => {
        if (!images || images.length === 0) {
            return 0;
        }

        return images.find((img) => img.isPrimary)?.id ?? images[0].id;
    };

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
        if (!ensure('MANAGE_ROOM_TYPES', 'create room type')) {
            return false;
        }

        if (!draft.Name.trim()) {
            toast.error('Room type name is required');
            return false;
        }

        setIsCreating(true);
        try {
            const normalizedPrimaryIndex =
                typeof createPrimaryIndex === 'string'
                    ? parseInt(createPrimaryIndex.split('-')[1], 10)
                    : Number(createPrimaryIndex);

            await roomTypesApi.create({
                ...draft,
                Files: createFiles,
                PrimaryImageIndex: Number.isFinite(normalizedPrimaryIndex) ? normalizedPrimaryIndex : 0,
            });

            toast.success('Room type created');
            setDraft(emptyDraft);
            setCreateFiles([]);
            setCreatePrimaryIndex(0);
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
        if (!editDraft.Name.trim()) {
            toast.error('Room type name is required');
            return false;
        }

        try {
            const updated = await roomTypesApi.update(roomTypeId, {
                ...editDraft,
                Files: editFiles,
            });

            // Handle primary image selection
            let finalPrimaryId: number | null = null;
            if (typeof editActiveIndex === 'number') {
                // Existing image was selected
                finalPrimaryId = editActiveIndex;
            } else if (typeof editActiveIndex === 'string') {
                // A new image was selected (resolved from returned list)
                const newIndex = parseInt(editActiveIndex.split('-')[1]);
                // New images are usually appended in the response gallery
                // We need to find the correct ID. 
                // Index is relative to the "editFiles" sent.
                // Response gallery order: existing ones first, then new ones? 
                // Or alphabetical by URL? Usually, it's deterministic.
                // Assuming new images start after editing.images.length? 
                // Actually, let's use the index in the returned images array.
                // The new images uploaded are added to the room type.
                const newImagePos = (editing?.images.length || 0) + newIndex;
                if (updated.images[newImagePos]) {
                    finalPrimaryId = updated.images[newImagePos].id;
                }
            }

            if (finalPrimaryId) {
                const currentPrimary = updated.images.find(img => img.isPrimary);
                if (!currentPrimary || currentPrimary.id !== finalPrimaryId) {
                    await roomTypesApi.setPrimaryImage(roomTypeId, finalPrimaryId);
                }
            }

            setEditFiles([]);
            setEditActiveIndex(0);
            return true;
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to update room type');
            return false;
        }
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

    const toggleRoomTypeActive = async (item: RoomTypeItem) => {
        if (!ensure('MANAGE_ROOM_TYPES', 'toggle room type active status')) {
            return;
        }

        try {
            await roomTypesApi.toggleActive(item.id);
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
            toast.error(apiError.message || 'Failed to toggle room type status');
        }
    };

    const openEdit = (row: RoomTypeItem) => {
        setEditing(row);
        setEditDraft({
            Name: row.name,
            BasePrice: row.basePrice,
            CapacityAdults: row.capacityAdults,
            CapacityChildren: row.capacityChildren,
            Description: row.description,
            View: row.view,
            BedType: row.bedType,
            SizeM2: row.sizeM2,
        });
        setEditFiles([]);
        setEditActiveIndex(getDefaultActiveImageId(row.images));
        setSelectedAmenityIds(row.amenities.map((amenity) => amenity.id));
    };

    const columns = [
        { key: 'name', label: 'Name', render: (row: RoomTypeItem) => row.name },
        { key: 'basePrice', label: 'Base Price', render: (row: RoomTypeItem) => `$${row.basePrice}` },
        { key: 'capacityAdults', label: 'Adults', render: (row: RoomTypeItem) => row.capacityAdults },
        { key: 'capacityChildren', label: 'Children', render: (row: RoomTypeItem) => row.capacityChildren },
        { key: 'bedType', label: 'Bed Type', render: (row: RoomTypeItem) => row.bedType || '-' },
        { key: 'view', label: 'View', render: (row: RoomTypeItem) => row.view || '-' },
        { key: 'sizeM2', label: 'Size (m²)', render: (row: RoomTypeItem) => row.sizeM2 != null ? `${row.sizeM2} m²` : '-' },
        { key: 'description', label: 'Description', render: (row: RoomTypeItem) => row.description || '-' },
        {
            key: 'status',
            label: 'Status',
            render: (row: RoomTypeItem) => (
                <button
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                        void toggleRoomTypeActive(row);
                    }}
                >
                    <Badge value={row.isActive ? 'Active' : 'Inactive'} />
                </button>
            ),
        },
        {
            key: 'amenities',
            label: 'Amenities',
            render: (row: RoomTypeItem) =>
                row.amenities.length > 0 ? (
                    <div 
                        className="flex flex-wrap gap-1 max-w-[300px] cursor-pointer hover:opacity-80 transition"
                        onClick={() => setViewAmenitiesTarget(row)}
                        title="Click to view all amenities"
                    >
                        {row.amenities.slice(0, 5).map((amenity) => (
                            <span key={amenity.id} className="rounded-full bg-cyan-50 px-2 py-1 text-xs text-cyan-700 whitespace-nowrap">
                                {amenity.name}
                            </span>
                        ))}
                        {row.amenities.length > 5 && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                +{row.amenities.length - 5}
                            </span>
                        )}
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
                    {/* <button
                        type="button"
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${row.isActive ? 'border-amber-200 text-amber-700' : 'border-emerald-200 text-emerald-700'}`}
                        onClick={() => {
                            void toggleRoomTypeActive(row);
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
                    <h2 className="text-2xl font-bold text-slate-900">Room Types</h2>
                    <p className="text-sm text-slate-500">Add and manage room type definitions for room creation.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => void loadRoomTypes()}
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
                        <PlusIcon className="h-4 w-4" /> Add Room Type
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-bold text-slate-600 animate-pulse">Loading room types...</p>
                </div>
            ) : rows.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No room types found.</div>
            ) : null}

            <Table columns={columns} rows={isLoading ? [] : rows} />

            <Modal
                open={openCreate}
                title="Add Room Type"
                onClose={() => {
                    setOpenCreate(false);
                    setDraft(emptyDraft);
                    setCreateFiles([]);
                    setCreatePrimaryIndex(0);
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
                            <Input placeholder="Example: Deluxe Sea View" value={draft.Name} onChange={(event) => setDraft((prev) => ({ ...prev, Name: event.target.value }))} />
                            <p className="text-xs text-slate-500">This name is shown when creating rooms.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <Input placeholder="Example: Large room with balcony" value={draft.Description ?? ''} onChange={(event) => setDraft((prev) => ({ ...prev, Description: event.target.value }))} />
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
                                <Input type="number" min={0} step="0.01" placeholder="0" value={String(draft.BasePrice)} onChange={(event) => setDraft((prev) => ({ ...prev, BasePrice: Number(event.target.value) }))} />
                                <p className="text-xs text-slate-500">Nightly price for this room type.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Adults</label>
                                <Input type="number" min={0} placeholder="1" value={String(draft.CapacityAdults)} onChange={(event) => setDraft((prev) => ({ ...prev, CapacityAdults: Number(event.target.value) }))} />
                                <p className="text-xs text-slate-500">Max adult guests.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Children</label>
                                <Input type="number" min={0} placeholder="0" value={String(draft.CapacityChildren)} onChange={(event) => setDraft((prev) => ({ ...prev, CapacityChildren: Number(event.target.value) }))} />
                                <p className="text-xs text-slate-500">Max child guests.</p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Bed Type</label>
                                <Input placeholder="e.g. King, Double, Twin" value={draft.BedType ?? ''} onChange={(event) => setDraft((prev) => ({ ...prev, BedType: event.target.value }))} />
                                <p className="text-xs text-slate-500">Type of bed in the room.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">View</label>
                                <Input placeholder="e.g. City View, Sea View" value={draft.View ?? ''} onChange={(event) => setDraft((prev) => ({ ...prev, View: event.target.value }))} />
                                <p className="text-xs text-slate-500">Window view description.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Size (m²)</label>
                                <Input type="number" min={0} placeholder="e.g. 45" value={draft.SizeM2 != null ? String(draft.SizeM2) : ''} onChange={(event) => setDraft((prev) => ({ ...prev, SizeM2: event.target.value ? Number(event.target.value) : null }))} />
                                <p className="text-xs text-slate-500">Room area in square meters.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2">
                            <PhotoIcon className="h-5 w-5 text-slate-500" />
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Gallery images</h3>
                                <p className="text-xs text-slate-500">Pick multiple photos. The first one will be primary.</p>
                            </div>
                        </div>
                        <ImageUpload
                            multiple
                            value={createFiles}
                            onChange={(val) => {
                                const files = Array.isArray(val) ? val : val ? [val] : [];
                                setCreateFiles(files);
                                if (files.length === 0) {
                                    setCreatePrimaryIndex(0);
                                    return;
                                }

                                if (typeof createPrimaryIndex === 'string') {
                                    const currentIndex = parseInt(createPrimaryIndex.split('-')[1], 10);
                                    if (!Number.isFinite(currentIndex) || currentIndex < 0 || currentIndex >= files.length) {
                                        setCreatePrimaryIndex('new-0');
                                    }
                                } else {
                                    setCreatePrimaryIndex('new-0');
                                }
                            }}
                            activeIndex={createPrimaryIndex}
                            onItemClick={(id) => setCreatePrimaryIndex(id)}
                            label="Click or drag room type photos"
                        />
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
                            <Input placeholder="Example: Deluxe Sea View" value={editDraft.Name} onChange={(event) => setEditDraft((prev) => ({ ...prev, Name: event.target.value }))} />
                            <p className="text-xs text-slate-500">This name appears in room creation and room lists.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <Input placeholder="Example: Large room with balcony" value={editDraft.Description ?? ''} onChange={(event) => setEditDraft((prev) => ({ ...prev, Description: event.target.value }))} />
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
                                <Input type="number" min={0} step="0.01" placeholder="0" value={String(editDraft.BasePrice)} onChange={(event) => setEditDraft((prev) => ({ ...prev, BasePrice: Number(event.target.value) }))} />
                                <p className="text-xs text-slate-500">Used for pricing a room of this type.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Adults</label>
                                <Input type="number" min={0} placeholder="1" value={String(editDraft.CapacityAdults)} onChange={(event) => setEditDraft((prev) => ({ ...prev, CapacityAdults: Number(event.target.value) }))} />
                                <p className="text-xs text-slate-500">Maximum adult guests.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Children</label>
                                <Input type="number" min={0} placeholder="0" value={String(editDraft.CapacityChildren)} onChange={(event) => setEditDraft((prev) => ({ ...prev, CapacityChildren: Number(event.target.value) }))} />
                                <p className="text-xs text-slate-500">Maximum child guests.</p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Bed Type</label>
                                <Input placeholder="e.g. King, Double, Twin" value={editDraft.BedType ?? ''} onChange={(event) => setEditDraft((prev) => ({ ...prev, BedType: event.target.value }))} />
                                <p className="text-xs text-slate-500">Type of bed in the room.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">View</label>
                                <Input placeholder="e.g. City View, Sea View" value={editDraft.View ?? ''} onChange={(event) => setEditDraft((prev) => ({ ...prev, View: event.target.value }))} />
                                <p className="text-xs text-slate-500">Window view description.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Size (m²)</label>
                                <Input type="number" min={0} placeholder="e.g. 45" value={editDraft.SizeM2 != null ? String(editDraft.SizeM2) : ''} onChange={(event) => setEditDraft((prev) => ({ ...prev, SizeM2: event.target.value ? Number(event.target.value) : null }))} />
                                <p className="text-xs text-slate-500">Room area in square meters.</p>
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

                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2">
                            <PhotoIcon className="h-5 w-5 text-slate-500" />
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Room gallery</h3>
                                <p className="text-xs text-slate-500">Pick any image (current or new) to set as primary.</p>
                            </div>
                        </div>

                        <ImageUpload
                            multiple
                            value={editFiles}
                            onChange={(val) => {
                                const files = Array.isArray(val) ? val : val ? [val] : [];
                                setEditFiles(files);
                            }}
                            existingFiles={editing?.images || []}
                            onDeleteExisting={async (id) => {
                                if (!editing) return;
                                if (!confirm('Are you sure you want to delete this image?')) return;
                                try {
                                    const deletedWasSelected = editActiveIndex === id;
                                    await roomTypesApi.deleteImage(editing.id, id);
                                    toast.success('Image deleted');
                                    // Update the editing item to reflect the deletion
                                    const updatedRows = await roomTypesApi.getAll();
                                    setRows(updatedRows);
                                    const found = updatedRows.find((r) => r.id === editing.id);
                                    if (found) {
                                        setEditing(found);

                                        if (deletedWasSelected) {
                                            setEditActiveIndex(getDefaultActiveImageId(found.images));
                                        } else {
                                            const selectedStillExists =
                                                typeof editActiveIndex === 'number'
                                                    ? found.images.some((img) => img.id === editActiveIndex)
                                                    : true;

                                            if (!selectedStillExists) {
                                                setEditActiveIndex(getDefaultActiveImageId(found.images));
                                            }
                                        }
                                    } else {
                                        setEditActiveIndex(0);
                                    }
                                } catch {
                                    toast.error('Failed to delete image');
                                }
                            }}
                            activeIndex={editActiveIndex}
                            onItemClick={(id) => setEditActiveIndex(id)}
                            label="Add more photos"
                        />
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

                                    if (!ensure('MANAGE_ROOM_TYPES', 'update room type')) {
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

            <Modal
                open={Boolean(viewAmenitiesTarget)}
                title={`Amenities: ${viewAmenitiesTarget?.name}`}
                onClose={() => setViewAmenitiesTarget(null)}
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {viewAmenitiesTarget?.amenities.map((amenity) => (
                        <div key={amenity.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                            {amenity.iconUrl ? (
                                <img src={amenity.iconUrl} alt={amenity.name} className="h-10 w-10 rounded-lg object-cover shadow-sm" />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                                    <PhotoIcon className="h-5 w-5" />
                                </div>
                            )}
                            <span className="text-sm font-medium text-slate-700">{amenity.name}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        onClick={() => setViewAmenitiesTarget(null)}
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </div>
    );
}
