import { useCallback, useEffect, useMemo, useState } from 'react';
import { EyeIcon, PlusIcon, Squares2X2Icon, PencilSquareIcon } from '@heroicons/react/24/outline';
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
import { paginate, queryIncludes, sortBy } from '../../utils/table';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

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
  const [draft, setDraft] = useState<Partial<Room>>({ roomType: 'Standard', status: 'Available', cleaningStatus: 'Clean' });

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
            if (!ensure('manage_rooms', 'update room status')) {
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
            if (!ensure('manage_rooms', 'update room condition')) {
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
          <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs" onClick={() => navigate(`/admin/rooms/${row.id}`)}>
            <Squares2X2Icon className="h-4 w-4" /> Manage Inventory
          </button>
        </div>
      ),
    },
  ];

  const createRoom = () => {
    if (!ensure('manage_rooms', 'create room')) {
      return;
    }

    if (!draft.roomNumber || !draft.floor || !draft.roomType) {
      toast.error('Please fill all required room fields');
      return;
    }

    const roomNumber = draft.roomNumber;
    const floorValue = Number(draft.floor);
    const roomTypeValue = draft.roomType;

    void (async () => {
      try {
        await roomsApi.create({
          roomNumber,
          floor: floorValue,
          roomType: roomTypeValue,
          status: draft.status,
          cleaningStatus: draft.cleaningStatus,
        });
        await loadRooms();
        setOpenCreate(false);
        setDraft({ roomType: 'Standard', status: 'Available', cleaningStatus: 'Clean' });
        toast.success(`Room ${roomNumber} created`);
      } catch (error) {
        const apiError = toApiError(error);
        toast.error(apiError.message || 'Failed to create room');
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
            if (!ensure('manage_rooms', 'create room')) {
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
        <Select value={roomType} onChange={(e) => setRoomType(e.target.value)}><option value="all">Room Type</option><option>Standard</option><option>Deluxe</option><option>Suite</option></Select>
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

      <Modal open={openCreate} title="Create Room" onClose={() => setOpenCreate(false)}>
        <div className="space-y-3">
          <Input placeholder="Room number" value={draft.roomNumber ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, roomNumber: e.target.value }))} />
          <Input placeholder="Floor" type="number" value={draft.floor ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, floor: Number(e.target.value) }))} />
          <Select value={draft.roomType} onChange={(e) => setDraft((prev) => ({ ...prev, roomType: e.target.value as Room['roomType'] }))}>
            <option>Standard</option><option>Deluxe</option><option>Suite</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Cancel</button>
            <button type="button" onClick={createRoom} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white">
              <PencilSquareIcon className="h-4 w-4" /> Save Room
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
