import { useCallback, useEffect, useMemo, useState } from 'react';
import { EyeIcon, PlusIcon, PencilSquareIcon, ArrowPathIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Table } from '../../components/Table';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';
import type { LayoutOutletContext } from '../../types/layout';
import type { Room } from '../../types/models';
import { toApiError } from '../../api/httpClient';
import { roomsApi } from '../../api/roomsApi';
import { roomTypesApi, type RoomTypeItem } from '../../api/roomTypesApi';
import { amenitiesApi, type AmenityItem } from '../../api/amenitiesApi';
import { equipmentsApi, type EquipmentItem } from '../../api/equipmentsApi';
import { roomInventoriesApi } from '../../api/roomInventoriesApi';
import { paginate, queryIncludes, sortBy } from '../../utils/table';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

interface CreateRoomDraft {
    roomNumber: string;
    floor: number;
    roomTypeId: number;
    status: Room['status'];
    cleaningStatus: Room['cleaningStatus'];
}

interface InventoryOption {
    id: number;
    name: string;
    unit: string;
    priceIfLost: number;
    availableQuantity: number;
}

interface SelectedInventoryValue {
    equipmentId: number;
    itemName: string;
    quantity: number;
    priceIfLost: number;
}

export function RoomsPage() {
    const navigate = useNavigate();
    const { ensure } = usePermissionCheck();
    const outletContext = useOutletContext<LayoutOutletContext>();
    const globalSearch = outletContext?.globalSearch ?? '';
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [cleaningStatus, setCleaningStatus] = useState('all');
    const [roomTypeIdFilter, setRoomTypeIdFilter] = useState('all');
    const [floor, setFloor] = useState('all');
    const [sortMode, setSortMode] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(1);
    const [openCreate, setOpenCreate] = useState(false);
    const [createMode, setCreateMode] = useState<'single' | 'bulk'>('single');
    const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
    const [isSaving, setIsSaving] = useState(false);
    const [amenityMode, setAmenityMode] = useState<'manual' | 'roomType'>('manual');
    const [inventoryMode, setInventoryMode] = useState<'manual' | 'cloneRoom'>('manual');
    const [cloneSourceRoomId, setCloneSourceRoomId] = useState<number | null>(null);
    const [draft, setDraft] = useState<CreateRoomDraft>({
        roomNumber: '',
        floor: 1,
        roomTypeId: 0,
        status: 'Available',
        cleaningStatus: 'Clean',
    });
    const [bulkStartRoom, setBulkStartRoom] = useState('');
    const [bulkEndRoom, setBulkEndRoom] = useState('');
    const [bulkStep, setBulkStep] = useState('1');
    const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
    const [amenities, setAmenities] = useState<AmenityItem[]>([]);
    const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);
    const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>([]);
    const [selectedInventories, setSelectedInventories] = useState<Record<string, SelectedInventoryValue>>({});

    const activeRoomTypes = useMemo(() => roomTypes.filter((item) => item.isActive), [roomTypes]);
    const activeAmenities = useMemo(() => amenities.filter((item) => item.isActive), [amenities]);

    const getEquipmentAvailableQuantity = useCallback(
        (item: EquipmentItem) => Math.max(0, item.totalQuantity - item.inUseQuantity - item.damagedQuantity - item.liquidatedQuantity),
        [],
    );

    const getInventoryAvailability = useCallback(
        (name: string) => inventoryOptions.find((item) => item.name === name)?.availableQuantity ?? 0,
        [inventoryOptions],
    );

    const parseBulkRoomNumbers = useCallback(() => {
        const start = Number(bulkStartRoom);
        const end = Number(bulkEndRoom);
        const step = Number(bulkStep) || 1;

        if (!bulkStartRoom || !bulkEndRoom || isNaN(start) || isNaN(end) || step <= 0) {
            return [];
        }

        const results: string[] = [];
        for (let i = start; i <= end; i += step) {
            results.push(String(i));
        }
        return results;
    }, [bulkStartRoom, bulkEndRoom, bulkStep]);

    const loadRooms = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await roomsApi.getAll();
            setRooms(data);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load rooms');
            setRooms([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadRooms();
    }, [loadRooms]);

    useEffect(() => {
        void (async () => {
            try {
                const [types, amenityData, equipmentData] = await Promise.all([
                    roomTypesApi.getAll(),
                    amenitiesApi.getAll(),
                    equipmentsApi.getAll(),
                ]);

                const equipmentOptions = equipmentData
                    .filter((item) => item.isActive)
                    .map((item) => ({
                        id: item.id,
                        name: item.name.trim(),
                        unit: item.unit,
                        priceIfLost: Number(item.defaultPriceIfLost ?? 0),
                        availableQuantity: getEquipmentAvailableQuantity(item),
                    }));

                setRoomTypes(types);
                setAmenities(amenityData);
                setInventoryOptions(equipmentOptions);
                if (types.some((item) => item.isActive)) {
                    const firstActiveRoomType = types.find((item) => item.isActive)!;
                    setDraft((prev) => ({ ...prev, roomTypeId: prev.roomTypeId || firstActiveRoomType.id }));
                }
            } catch (error) {
                const apiError = toApiError(error);
                toast.error(apiError.message || 'Failed to load room setup data');
            }
        })();
    }, [getEquipmentAvailableQuantity]);

    const filtered = useMemo(() => {
        const rows = rooms.filter((item) => {
            const searchHit =
                queryIncludes(item.roomNumber, globalSearch) || queryIncludes(item.roomType, globalSearch);

            return (
                searchHit &&
                (status === 'all' || item.status === status) &&
                (cleaningStatus === 'all' || item.cleaningStatus === cleaningStatus) &&
                (roomTypeIdFilter === 'all' || String(item.roomTypeId ?? '') === roomTypeIdFilter) &&
                (floor === 'all' || String(item.floor) === floor)
            );
        });

        return sortBy(rows, (row) => row.roomNumber, sortMode);
    }, [rooms, globalSearch, status, cleaningStatus, roomTypeIdFilter, floor, sortMode]);

    const pageSize = 8;
    const paged = paginate(filtered, page, pageSize);
    const floorOptions = useMemo(
        () => Array.from(new Set(rooms.map((room) => room.floor))).sort((a, b) => a - b),
        [rooms],
    );
    const roomTypeOptions = useMemo(() => {
        const usedRoomTypeIds = Array.from(
            new Set(
                rooms
                    .map((room) => room.roomTypeId)
                    .filter((id): id is number => typeof id === 'number' && id > 0),
            ),
        );

        return usedRoomTypeIds
            .map((id) => {
                const type = roomTypes.find((item) => item.id === id);
                return {
                    id,
                    name: type?.name ?? `Room Type #${id}`,
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [rooms, roomTypes]);

    const columns = [
        { key: 'roomNumber', label: 'Room Number', render: (row: Room) => row.roomNumber },
        { key: 'floor', label: 'Floor', render: (row: Room) => row.floor },
        { key: 'roomType', label: 'Room Type', render: (row: Room) => row.roomType },
        {
            key: 'status',
            label: 'Status',
            render: (row: Room) => (
                <Select
                    value={row.status}
                    style={{ minWidth: '130px' }}
                    onChange={(event) => {
                        if (!ensure('MANAGE_ROOMS', 'update room status')) {
                            return;
                        }
                        const value = event.target.value as Room['status'];
                        void (async () => {
                            try {
                                await roomsApi.changeStatus(row.id, value);
                                setRooms((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: value, cleaningStatus: value === 'Available' ? 'Clean' : value === 'InsClean' ? 'Inspecting' : item.cleaningStatus } : item)));
                                toast.success(`Room ${row.roomNumber} status updated`);
                            } catch (error) {
                                const apiError = toApiError(error);
                                toast.error(apiError.message || 'Failed to update room status');
                            }
                        })();
                    }}
                >
                    <option>Available</option>
                    <option>Maintenance</option>
                    <option>Occupied</option>
                    <option>InsClean</option>
                </Select>
            ),
        },
        {
            key: 'condition',
            label: 'Condition',
            render: (row: Room) => (
                <Select
                    value={row.cleaningStatus}
                    style={{ minWidth: '130px' }}
                    onChange={(event) => {
                        if (!ensure('UPDATE_CLEANING', 'update room condition')) {
                            return;
                        }
                        const value = event.target.value as Room['cleaningStatus'];
                        void (async () => {
                            try {
                                await roomsApi.changeCleaningStatus(row.id, value);
                                setRooms((prev) => prev.map((item) => (item.id === row.id ? { ...item, cleaningStatus: value } : item)));
                                toast.success(`Room ${row.roomNumber} condition updated`);
                            } catch (error) {
                                const apiError = toApiError(error);
                                toast.error(apiError.message || 'Failed to update room condition');
                            }
                        })();
                    }}
                >
                    <option>Clean</option>
                    <option>Inspecting</option>
                    <option>Cleaning</option>
                    <option>Dirty</option>
                </Select>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: Room) => (
                <div className="flex gap-2">
                    <button type="button" className="w-30 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs" onClick={() => navigate(`/admin/rooms/${row.id}`)}>
                        <EyeIcon className="h-4 w-4" /> View Details
                    </button>
                    <button type="button" className={` w-30 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${row.cleaningRequested ? 'text-red-600' : 'text-green-700'}`}
                        onClick={() => {
                            if (!ensure('MANAGE_ROOMS', `${row.cleaningRequested ? 'cancel cleaning request' : 'request cleaning'}`)) {
                                return;
                            }
                            void (async () => {
                                try {
                                    await roomsApi.requestCleaning(row.id, !row.cleaningRequested);
                                    setRooms((prev) => prev.map((item) => (item.id === row.id ? { ...item, cleaningRequested: !item.cleaningRequested } : item)));
                                } catch (error) {
                                    const apiError = toApiError(error);
                                    toast.error(apiError.message || 'Failed to update cleaning request');
                                }
                            })();
                        }}>
                        <ArrowUturnLeftIcon className={`h-4 w-4`} /> {row.cleaningRequested === true ? 'Cancel Request' : 'Request Cleaning'}
                    </button>
                </div>
            ),
        },
    ];

    const resetCreateFlow = () => {
        setCreateStep(1);
        setIsSaving(false);
        setAmenityMode('manual');
        setInventoryMode('manual');
        setCloneSourceRoomId(null);
        setSelectedAmenityIds([]);
        setSelectedInventories({});
        setBulkStartRoom('');
        setBulkEndRoom('');
        setBulkStep('1');
        const firstActiveRoomTypeId = activeRoomTypes[0]?.id ?? 0;
        setDraft((prev) => ({
            roomNumber: '',
            floor: 1,
            roomTypeId: firstActiveRoomTypeId || prev.roomTypeId,
            status: 'Available',
            cleaningStatus: 'Clean',
        }));
    };

    const createRoomStep = () => {
        if (!ensure('MANAGE_ROOMS', 'create room')) {
            return;
        }

        if (!draft.floor || !draft.roomTypeId) {
            toast.error('Please fill all required room fields');
            return;
        }

        if (createMode === 'single' && !draft.roomNumber.trim()) {
            toast.error('Please fill all required room fields');
            return;
        }

        if (createMode === 'bulk' && parseBulkRoomNumbers().length === 0) {
            toast.error('Please provide at least one room number for bulk create');
            return;
        }

        if (!activeRoomTypes.some((item) => item.id === draft.roomTypeId)) {
            toast.error('Selected room type is inactive');
            return;
        }

        setCreateStep(2);
        toast.success('Room information saved. Continue to amenities');
    };

    const saveAmenitiesStep = () => {
        setCreateStep(3);
        toast.success('Amenities selection saved. Continue to equipment setup');
    };

    const finishCreateFlow = () => {
        void (async () => {
            setIsSaving(true);
            try {
                const roomNumbers = createMode === 'bulk' ? parseBulkRoomNumbers() : [draft.roomNumber.trim()];
                const floorValue = Number(draft.floor);

                if (roomNumbers.length === 0) {
                    toast.error('No room number provided');
                    return;
                }

                if (createMode === 'bulk') {
                    await roomsApi.bulkCreate(
                        roomNumbers.map((roomNumber) => ({
                            roomNumber,
                            floor: floorValue,
                            roomTypeId: draft.roomTypeId,
                            status: draft.status,
                            cleaningStatus: draft.cleaningStatus,
                        })),
                    );
                } else {
                    await roomsApi.create({
                        roomNumber: roomNumbers[0],
                        floor: floorValue,
                        roomTypeId: draft.roomTypeId,
                        status: draft.status,
                        cleaningStatus: draft.cleaningStatus,
                    });
                }

                const latestRooms = await roomsApi.getAll();
                const normalizedRoomNumbers = new Set(roomNumbers.map((item) => item.toLowerCase()));
                const createdRooms = latestRooms
                    .filter((item) => normalizedRoomNumbers.has(item.roomNumber.trim().toLowerCase()))
                    .sort((a, b) => b.id - a.id)
                    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.roomNumber.trim().toLowerCase() === item.roomNumber.trim().toLowerCase()) === index);

                if (createdRooms.length === 0) {
                    toast.error(createMode === 'bulk' ? 'Rooms created but cannot resolve created room IDs' : 'Room created but cannot resolve room ID');
                    return;
                }

                const selectedAmenities =
                    amenityMode === 'roomType'
                        ? (activeRoomTypes.find((item) => item.id === draft.roomTypeId)?.amenities ?? []).filter((item) => item.isActive)
                        : activeAmenities.filter((item) => selectedAmenityIds.includes(item.id));

                const selectedEquipmentItems =
                    inventoryMode === 'cloneRoom'
                        ? (() => {
                            if (!cloneSourceRoomId) {
                                throw new Error('Please select a room to clone equipment from');
                            }

                            return roomInventoriesApi.getByRoom(cloneSourceRoomId).then((items) =>
                                items
                                    .filter((item) => item.isActive)
                                    .map((item) => ({
                                        equipmentId: Number(item.equipmentId || 0),
                                        itemName: item.name,
                                        quantity: Number(item.quantity || 0),
                                        priceIfLost: Number(item.compensationPrice || 0),
                                    }))
                                    .filter((item) => item.equipmentId > 0 && item.itemName.trim().length > 0 && item.quantity > 0),
                            );
                        })()
                        : Promise.resolve(
                            Object.entries(selectedInventories)
                                .map(([, value]) => ({
                                    equipmentId: Number(value.equipmentId || 0),
                                    itemName: value.itemName,
                                    quantity: Number(value.quantity || 0),
                                    priceIfLost: Number(value.priceIfLost || 0),
                                }))
                                .filter((item) => item.equipmentId > 0 && item.itemName.trim().length > 0 && item.quantity > 0),
                        );

                const normalizedItems = await selectedEquipmentItems;

                if (inventoryMode === 'manual') {
                    for (const item of normalizedItems) {
                        const availableQuantity = getInventoryAvailability(item.itemName);
                        if (item.quantity > availableQuantity) {
                            throw new Error(`Not enough quantity for ${item.itemName}. Available: ${availableQuantity}, Requested: ${item.quantity}`);
                        }
                    }
                }

                await Promise.all(
                    createdRooms.map(async (room) => {
                        await Promise.all(
                            selectedAmenities.map((item) =>
                                roomInventoriesApi.create({
                                    roomId: room.id,
                                    amenityId: item.id,
                                    itemName: `${item.name}`,
                                    quantity: 1,
                                    priceIfLost: 0,
                                }),
                            ),
                        );

                        await Promise.all(
                            normalizedItems.map((item) =>
                                roomInventoriesApi.create({
                                    roomId: room.id,
                                    equipmentId: item.equipmentId,
                                    itemName: item.itemName.trim(),
                                    quantity: item.quantity,
                                    priceIfLost: item.priceIfLost,
                                }),
                            ),
                        );
                    }),
                );

                await loadRooms();
                setOpenCreate(false);
                resetCreateFlow();
                toast.success(createMode === 'bulk' ? `Created ${createdRooms.length} rooms with amenities and equipment` : 'Room created with amenities and equipment');
            } catch (error) {
                const apiError = toApiError(error);
                toast.error(apiError.message || 'Failed to complete room setup');
            } finally {
                setIsSaving(false);
            }
        })();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Room Management</h2>
                    <p className="text-sm text-slate-500">Manage status, cleaning and room inventory operations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => void loadRooms()}
                        className="p-2 text-slate-500 hover:text-cyan-600 transition bg-white border border-slate-200 rounded-xl"
                        title="Refresh"
                    >
                        <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (!ensure('MANAGE_ROOMS', 'create room')) {
                                return;
                            }

                            if (activeRoomTypes.length === 0) {
                                toast.error('No active room type available');
                                return;
                            }

                            setCreateMode('single');
                            setOpenCreate(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
                    >
                        <PlusIcon className="h-4 w-4" /> Create Room
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (!ensure('MANAGE_ROOMS', 'bulk create rooms')) {
                                return;
                            }

                            if (activeRoomTypes.length === 0) {
                                toast.error('No active room type available');
                                return;
                            }

                            setCreateMode('bulk');
                            setOpenCreate(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-700 px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50"
                    >
                        <PlusIcon className="h-4 w-4" /> Bulk Create
                    </button>
                </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
                <Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Room Status</option><option>Available</option><option>Occupied</option><option>Inspecting</option><option>Cleaning</option><option>Maintenance</option></Select>
                <Select value={cleaningStatus} onChange={(e) => setCleaningStatus(e.target.value)}><option value="all">Cleaning Status</option><option>Clean</option><option>Dirty</option><option>Inspecting</option></Select>
                <Select value={roomTypeIdFilter} onChange={(e) => setRoomTypeIdFilter(e.target.value)}><option value="all">Room Type</option>{roomTypeOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
                <Select value={floor} onChange={(e) => setFloor(e.target.value)}><option value="all">Floor</option>{floorOptions.map((f) => <option key={f}>{f}</option>)}</Select>
                <Select value={sortMode} onChange={(e) => setSortMode(e.target.value as 'asc' | 'desc')}><option value="asc">Sort A-Z</option><option value="desc">Sort Z-A</option></Select>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-bold text-slate-600 animate-pulse">Loading rooms...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                    {rooms.length === 0 ? 'No rooms found' : 'No results match your filters'}
                </div>
            ) : (
                <>
                    <Table columns={columns} rows={paged} />
                    <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
                </>
            )}

            <Modal
                open={openCreate}
                title={`${createMode === 'bulk' ? 'Bulk Create Rooms' : 'Create Room'} - Step ${createStep}/3`}
                onClose={() => {
                    setOpenCreate(false);
                    resetCreateFlow();
                }}
            >
                <div className="space-y-5">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className={createStep >= 1 ? 'font-semibold text-cyan-700' : ''}>1. Create room</span>
                            <span>/</span>
                            <span className={createStep >= 2 ? 'font-semibold text-cyan-700' : ''}>2. Add amenities</span>
                            <span>/</span>
                            <span className={createStep >= 3 ? 'font-semibold text-cyan-700' : ''}>3. Add inventory</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            {createMode === 'bulk' ? 'Create multiple rooms quickly with shared amenities and equipment setup.' : 'Create one room and continue with amenities and equipment setup.'}
                        </p>
                    </div>

                    {createStep === 1 ? (
                        <>
                            <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Room information</h3>
                                    <p className="text-xs text-slate-500">Provide room number, floor, and room type before continuing.</p>
                                </div>

                                {createMode === 'single' ? (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Room number</label>
                                        <Input placeholder="Example: 101" value={draft.roomNumber} onChange={(e) => setDraft((prev) => ({ ...prev, roomNumber: e.target.value }))} />
                                        <p className="text-xs text-slate-500">Unique room number used for check-in and operations.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Start number</label>
                                                <Input 
                                                    type="number" 
                                                    placeholder="101" 
                                                    value={bulkStartRoom} 
                                                    onChange={(e) => setBulkStartRoom(e.target.value)} 
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">End number</label>
                                                <Input 
                                                    type="number" 
                                                    placeholder="110" 
                                                    value={bulkEndRoom} 
                                                    onChange={(e) => setBulkEndRoom(e.target.value)} 
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Step</label>
                                                <Input 
                                                    type="number" 
                                                    placeholder="1" 
                                                    value={bulkStep} 
                                                    onChange={(e) => setBulkStep(e.target.value)} 
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 italic">
                                            Generates a sequence from {bulkStartRoom || '...'} to {bulkEndRoom || '...'} with step {bulkStep || '1'}.
                                            <br />
                                            Detected <span className="font-bold text-cyan-700">{parseBulkRoomNumbers().length}</span> unique room number(s).
                                        </p>
                                    </div>
                                )}

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Floor</label>
                                        <Input placeholder="Example: 1" type="number" value={draft.floor} onChange={(e) => setDraft((prev) => ({ ...prev, floor: Number(e.target.value) }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Room type</label>
                                        <Select value={String(draft.roomTypeId)} onChange={(e) => setDraft((prev) => ({ ...prev, roomTypeId: Number(e.target.value) }))}>
                                            {activeRoomTypes.map((type) => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                            </section>

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => { setOpenCreate(false); resetCreateFlow(); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Cancel</button>
                                <button type="button" disabled={isSaving} onClick={createRoomStep} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                                    <PencilSquareIcon className="h-4 w-4" /> {isSaving ? 'Creating...' : createMode === 'bulk' ? 'Continue Bulk Setup' : 'Create Room'}
                                </button>
                            </div>
                        </>
                    ) : null}

                    {createStep === 2 ? (
                        <>
                            <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Amenities setup</h3>
                                    <p className="text-xs text-slate-500">Choose to add amenities manually or inherit from selected room type.</p>
                                </div>

                                <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2">
                                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                        <input
                                            type="radio"
                                            name="amenity-mode"
                                            checked={amenityMode === 'manual'}
                                            onChange={() => setAmenityMode('manual')}
                                        />
                                        Add manually
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                        <input
                                            type="radio"
                                            name="amenity-mode"
                                            checked={amenityMode === 'roomType'}
                                            onChange={() => setAmenityMode('roomType')}
                                        />
                                        Add from room type
                                    </label>
                                </div>

                                {amenityMode === 'manual' ? (
                                    <div className="max-h-56 space-y-2 overflow-auto rounded-lg border border-slate-200 bg-white p-3">
                                        {activeAmenities.map((item) => (
                                            <label key={item.id} className="flex items-center gap-2 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAmenityIds.includes(item.id)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setSelectedAmenityIds((prev) =>
                                                            checked ? [...prev, item.id] : prev.filter((id) => id !== item.id),
                                                        );
                                                    }}
                                                />
                                                {item.name}
                                            </label>
                                        ))}
                                        {activeAmenities.length === 0 ? <p className="text-xs text-slate-400">No active amenities found.</p> : null}
                                    </div>
                                ) : (
                                    <div className="max-h-56 space-y-2 overflow-auto rounded-lg border border-slate-200 bg-white p-3">
                                        {(activeRoomTypes.find((item) => item.id === draft.roomTypeId)?.amenities ?? []).filter((item) => item.isActive).map((item) => (
                                            <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                                <span>{item.name}</span>
                                                <span className="text-xs text-cyan-700">from room type</span>
                                            </div>
                                        ))}
                                        {((activeRoomTypes.find((item) => item.id === draft.roomTypeId)?.amenities ?? []).filter((item) => item.isActive).length) === 0 ? (
                                            <p className="text-xs text-slate-400">This room type has no active amenities.</p>
                                        ) : null}
                                    </div>
                                )}
                            </section>

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setCreateStep(1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Back</button>
                                <button type="button" disabled={isSaving} onClick={saveAmenitiesStep} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                                    {isSaving ? 'Saving...' : 'Save Amenities'}
                                </button>
                            </div>
                        </>
                    ) : null}

                    {createStep === 3 ? (
                        <>
                            <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Equipment setup</h3>
                                    <p className="text-xs text-slate-500">Add equipment manually or clone equipment from another room.</p>
                                </div>

                                <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2">
                                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                        <input
                                            type="radio"
                                            name="inventory-mode"
                                            checked={inventoryMode === 'manual'}
                                            onChange={() => {
                                                setInventoryMode('manual');
                                                setCloneSourceRoomId(null);
                                            }}
                                        />
                                        Add equipment manually
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                        <input
                                            type="radio"
                                            name="inventory-mode"
                                            checked={inventoryMode === 'cloneRoom'}
                                            onChange={() => {
                                                setInventoryMode('cloneRoom');
                                                setSelectedInventories({});
                                            }}
                                        />
                                        Clone from another room
                                    </label>
                                </div>

                                {inventoryMode === 'manual' ? (
                                    <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-slate-200 bg-white p-3">
                                        {inventoryOptions.map((item) => {
                                            const key = String(item.id);
                                            const selected = Boolean(selectedInventories[key]);
                                            const quantity = selectedInventories[key]?.quantity ?? 1;
                                            const priceIfLost = selectedInventories[key]?.priceIfLost ?? item.priceIfLost;
                                            const isOutOfStock = item.availableQuantity <= 0;

                                            return (
                                                <div key={item.name} className="rounded-lg border border-slate-100 p-2">
                                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={selected}
                                                            disabled={isOutOfStock}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setSelectedInventories((prev) => {
                                                                    if (!checked) {
                                                                        const next = { ...prev };
                                                                        delete next[key];
                                                                        return next;
                                                                    }

                                                                    return {
                                                                        ...prev,
                                                                        [key]: {
                                                                            equipmentId: item.id,
                                                                            itemName: item.name,
                                                                            quantity: prev[key]?.quantity ?? 1,
                                                                            priceIfLost: prev[key]?.priceIfLost ?? item.priceIfLost,
                                                                        },
                                                                    };
                                                                });
                                                            }}
                                                        />
                                                        <span>{item.name}</span>
                                                        <span className="ml-auto text-xs text-cyan-700">
                                                            {isOutOfStock ? 'Out of stock' : `Available: ${item.availableQuantity} ${item.unit}`}
                                                        </span>
                                                    </label>

                                                    {selected ? (
                                                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                                                            <Input
                                                                placeholder="Quantity"
                                                                type="number"
                                                                min={1}
                                                                max={item.availableQuantity || undefined}
                                                                value={quantity}
                                                                onChange={(e) =>
                                                                    setSelectedInventories((prev) => ({
                                                                        ...prev,
                                                                        [key]: {
                                                                            equipmentId: item.id,
                                                                            itemName: item.name,
                                                                            quantity: Number(e.target.value),
                                                                            priceIfLost,
                                                                        },
                                                                    }))
                                                                }
                                                            />
                                                            <Input
                                                                placeholder="Price if lost"
                                                                type="number"
                                                                value={priceIfLost}
                                                                onChange={(e) =>
                                                                    setSelectedInventories((prev) => ({
                                                                        ...prev,
                                                                        [key]: {
                                                                            equipmentId: item.id,
                                                                            itemName: item.name,
                                                                            quantity,
                                                                            priceIfLost: Number(e.target.value),
                                                                        },
                                                                    }))
                                                                }
                                                            />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                        {inventoryOptions.length === 0 ? <p className="text-xs text-slate-400">No inventory templates found.</p> : null}
                                    </div>
                                ) : (
                                    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                                        <p className="text-xs text-slate-500">Choose an existing room. Its equipment list will be copied to the new room.</p>
                                        <Select
                                            value={cloneSourceRoomId ? String(cloneSourceRoomId) : ''}
                                            onChange={(e) => setCloneSourceRoomId(e.target.value ? Number(e.target.value) : null)}
                                        >
                                            <option value="">Select source room</option>
                                            {rooms
                                                .map((room) => (
                                                    <option key={room.id} value={room.id}>
                                                        {room.roomNumber} - {room.roomType}
                                                    </option>
                                                ))}
                                        </Select>
                                    </div>
                                )}
                            </section>

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setCreateStep(2)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Back</button>
                                <button type="button" disabled={isSaving} onClick={finishCreateFlow} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                                    {isSaving ? 'Completing...' : 'Finish Setup'}
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>
            </Modal>
        </div>
    );
}
