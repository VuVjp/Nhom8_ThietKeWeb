import { useCallback, useEffect, useMemo, useState } from 'react';
import { EyeIcon, PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
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
import { roomTypesApi } from '../../api/roomTypesApi';
import { amenitiesApi, type AmenityItem } from '../../api/amenitiesApi';
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
  name: string;
  priceIfLost: number;
}

interface SelectedInventoryValue {
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
  const [roomType, setRoomType] = useState('all');
  const [floor, setFloor] = useState('all');
  const [sortMode, setSortMode] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState<number | null>(null);
  const [draft, setDraft] = useState<CreateRoomDraft>({
    roomNumber: '',
    floor: 1,
    roomTypeId: 0,
    status: 'Available',
    cleaningStatus: 'Clean',
  });
  const [roomTypes, setRoomTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [amenities, setAmenities] = useState<AmenityItem[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);
  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>([]);
  const [selectedInventories, setSelectedInventories] = useState<Record<string, SelectedInventoryValue>>({});

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
        const [types, amenityData, inventoryData] = await Promise.all([
          roomTypesApi.getAll(),
          amenitiesApi.getAll(),
          roomInventoriesApi.getAll(),
        ]);

        const uniqueInventoryMap = new Map<string, InventoryOption>();
        inventoryData.forEach((item) => {
          if (!item.name) {
            return;
          }

          const key = item.name.trim();
          if (!uniqueInventoryMap.has(key)) {
            uniqueInventoryMap.set(key, {
              name: key,
              priceIfLost: Number(item.compensationPrice ?? item.price ?? 0),
            });
          }
        });

        setRoomTypes(types);
        setAmenities(amenityData);
        setInventoryOptions(Array.from(uniqueInventoryMap.values()));
        if (types.length > 0) {
          setDraft((prev) => ({ ...prev, roomTypeId: prev.roomTypeId || types[0].id }));
        }
      } catch (error) {
        const apiError = toApiError(error);
        toast.error(apiError.message || 'Failed to load room setup data');
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const rows = rooms.filter((item) => {
      const searchHit =
        queryIncludes(item.roomNumber, globalSearch) || queryIncludes(item.roomType, globalSearch);

      return (
        searchHit &&
        (status === 'all' || item.status === status) &&
        (cleaningStatus === 'all' || item.cleaningStatus === cleaningStatus) &&
        (roomType === 'all' || item.roomType === roomType) &&
        (floor === 'all' || String(item.floor) === floor)
      );
    });

    return sortBy(rows, (row) => row.roomNumber, sortMode);
  }, [rooms, globalSearch, status, cleaningStatus, roomType, floor, sortMode]);

  const pageSize = 8;
  const paged = paginate(filtered, page, pageSize);
  const floorOptions = useMemo(
    () => Array.from(new Set(rooms.map((room) => room.floor))).sort((a, b) => a - b),
    [rooms],
  );
  const roomTypeOptions = useMemo(
    () => Array.from(new Set(rooms.map((room) => room.roomType))).sort((a, b) => a.localeCompare(b)),
    [rooms],
  );

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
          onChange={(event) => {
            if (!ensure('change_room_status', 'update room status')) {
              return;
            }
            const value = event.target.value as Room['status'];
            void (async () => {
              try {
                await roomsApi.changeStatus(row.id, value);
                setRooms((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: value } : item)));
                toast.success(`Room ${row.roomNumber} status updated`);
              } catch (error) {
                const apiError = toApiError(error);
                toast.error(apiError.message || 'Failed to update room status');
              }
            })();
          }}
        >
          <option>Available</option>
          <option>Occupied</option>
          <option>Cleaning</option>
          <option>Inspecting</option>
        </Select>
      ),
    },
    {
      key: 'condition',
      label: 'Condition',
      render: (row: Room) => (
        <Select
          value={row.cleaningStatus}
          onChange={(event) => {
            if (!ensure('change_room_cleaning_status', 'update room condition')) {
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
          <option>Dirty</option>
          <option>Inspecting</option>
        </Select>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Room) => (
        <div className="flex gap-2">
          <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs" onClick={() => navigate(`/admin/rooms/${row.id}`)}>
            <EyeIcon className="h-4 w-4" /> View Details
          </button>
        </div>
      ),
    },
  ];

  const resetCreateFlow = () => {
    setCreateStep(1);
    setIsSaving(false);
    setCreatedRoomId(null);
    setSelectedAmenityIds([]);
    setSelectedInventories({});
    setDraft((prev) => ({
      roomNumber: '',
      floor: 1,
      roomTypeId: roomTypes[0]?.id ?? prev.roomTypeId,
      status: 'Available',
      cleaningStatus: 'Clean',
    }));
  };

  const createRoomStep = () => {
    if (!ensure('create_room', 'create room')) {
      return;
    }

    if (!draft.roomNumber || !draft.floor || !draft.roomTypeId) {
      toast.error('Please fill all required room fields');
      return;
    }

    const roomNumber = draft.roomNumber.trim();
    const floorValue = Number(draft.floor);

    void (async () => {
      setIsSaving(true);
      try {
        await roomsApi.create({
          roomNumber,
          floor: floorValue,
          roomTypeId: draft.roomTypeId,
          status: draft.status,
          cleaningStatus: draft.cleaningStatus,
        });

        const latestRooms = await roomsApi.getAll();
        const createdRoom = latestRooms
          .filter((item) => item.roomNumber === roomNumber)
          .sort((a, b) => b.id - a.id)[0];

        if (!createdRoom || !createdRoom.id) {
          toast.error('Room created but cannot resolve room ID');
          return;
        }

        setCreatedRoomId(createdRoom.id);
        setCreateStep(2);
        toast.success(`Room ${roomNumber} created. Continue to amenities`);
      } catch (error) {
        const apiError = toApiError(error);
        toast.error(apiError.message || 'Failed to create room');
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const saveAmenitiesStep = () => {
    if (!createdRoomId) {
      toast.error('Missing room ID. Please recreate room');
      return;
    }

    void (async () => {
      setIsSaving(true);
      try {
        const selected = amenities.filter((item) => selectedAmenityIds.includes(item.id));
        await Promise.all(
          selected.map((item) =>
            roomInventoriesApi.create({
              roomId: createdRoomId,
              itemName: `[Amenity] ${item.name}`,
              quantity: 1,
              priceIfLost: 0,
            }),
          ),
        );
        setCreateStep(3);
        toast.success('Amenities added. Continue to room items');
      } catch (error) {
        const apiError = toApiError(error);
        toast.error(apiError.message || 'Failed to add amenities');
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const finishCreateFlow = () => {
    if (!createdRoomId) {
      toast.error('Missing room ID. Please recreate room');
      return;
    }

    void (async () => {
      setIsSaving(true);
      try {
        const selectedItems = Object.entries(selectedInventories)
          .map(([itemName, value]) => ({
            itemName,
            quantity: Number(value.quantity || 0),
            priceIfLost: Number(value.priceIfLost || 0),
          }))
          .filter((item) => item.itemName.trim().length > 0 && item.quantity > 0);

        await Promise.all(
          selectedItems.map((item) =>
            roomInventoriesApi.create({
              roomId: createdRoomId,
              itemName: item.itemName.trim(),
              quantity: item.quantity,
              priceIfLost: item.priceIfLost,
            }),
          ),
        );

        await loadRooms();
        setOpenCreate(false);
        resetCreateFlow();
        toast.success('Room created with amenities and inventory');
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
        <button
          type="button"
          onClick={() => {
            if (!ensure('create_room', 'create room')) {
              return;
            }
            setOpenCreate(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
        >
          <PlusIcon className="h-4 w-4" /> Create Room
        </button>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Room Status</option><option>Available</option><option>Occupied</option></Select>
        <Select value={cleaningStatus} onChange={(e) => setCleaningStatus(e.target.value)}><option value="all">Cleaning Status</option><option>Clean</option><option>Dirty</option><option>Inspecting</option></Select>
        <Select value={roomType} onChange={(e) => setRoomType(e.target.value)}><option value="all">Room Type</option>{roomTypeOptions.map((item) => <option key={item}>{item}</option>)}</Select>
        <Select value={floor} onChange={(e) => setFloor(e.target.value)}><option value="all">Floor</option>{floorOptions.map((f) => <option key={f}>{f}</option>)}</Select>
        <Select value={sortMode} onChange={(e) => setSortMode(e.target.value as 'asc' | 'desc')}><option value="asc">Sort A-Z</option><option value="desc">Sort Z-A</option></Select>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Loading rooms...
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
        title={`Create Room - Step ${createStep}/3`}
        onClose={() => {
          setOpenCreate(false);
          resetCreateFlow();
        }}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={createStep >= 1 ? 'font-semibold text-cyan-700' : ''}>1. Create room</span>
            <span>/</span>
            <span className={createStep >= 2 ? 'font-semibold text-cyan-700' : ''}>2. Add amenities</span>
            <span>/</span>
            <span className={createStep >= 3 ? 'font-semibold text-cyan-700' : ''}>3. Add inventory</span>
          </div>

          {createStep === 1 ? (
            <>
              <Input placeholder="Room number" value={draft.roomNumber} onChange={(e) => setDraft((prev) => ({ ...prev, roomNumber: e.target.value }))} />
              <Input placeholder="Floor" type="number" value={draft.floor} onChange={(e) => setDraft((prev) => ({ ...prev, floor: Number(e.target.value) }))} />
              <Select value={String(draft.roomTypeId)} onChange={(e) => setDraft((prev) => ({ ...prev, roomTypeId: Number(e.target.value) }))}>
                {roomTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </Select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setOpenCreate(false); resetCreateFlow(); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Cancel</button>
                <button type="button" disabled={isSaving} onClick={createRoomStep} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  <PencilSquareIcon className="h-4 w-4" /> {isSaving ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </>
          ) : null}

          {createStep === 2 ? (
            <>
              <p className="text-sm text-slate-600">Select amenities to attach to this room.</p>
              <div className="max-h-56 space-y-2 overflow-auto rounded-lg border border-slate-200 p-3">
                {amenities.map((item) => (
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
                {amenities.length === 0 ? <p className="text-xs text-slate-400">No amenities found.</p> : null}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCreateStep(1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Back</button>
                <button type="button" disabled={isSaving} onClick={saveAmenitiesStep} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {isSaving ? 'Saving...' : 'Save Amenities'}
                </button>
              </div>
            </>
          ) : null}

          {createStep === 3 ? (
            <>
              <p className="text-sm text-slate-600">Select inventory items to add to this room.</p>
              <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-slate-200 p-3">
                {inventoryOptions.map((item) => {
                  const selected = Boolean(selectedInventories[item.name]);
                  const quantity = selectedInventories[item.name]?.quantity ?? 1;
                  const priceIfLost = selectedInventories[item.name]?.priceIfLost ?? item.priceIfLost;

                  return (
                    <div key={item.name} className="rounded-lg border border-slate-100 p-2">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedInventories((prev) => {
                              if (!checked) {
                                const next = { ...prev };
                                delete next[item.name];
                                return next;
                              }

                              return {
                                ...prev,
                                [item.name]: {
                                  quantity: prev[item.name]?.quantity ?? 1,
                                  priceIfLost: prev[item.name]?.priceIfLost ?? item.priceIfLost,
                                },
                              };
                            });
                          }}
                        />
                        {item.name}
                      </label>

                      {selected ? (
                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                          <Input
                            placeholder="Quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) =>
                              setSelectedInventories((prev) => ({
                                ...prev,
                                [item.name]: {
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
                                [item.name]: {
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
              <div className="flex justify-end gap-2 pt-2">
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
