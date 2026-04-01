import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { CleaningCondition, CleaningRoom } from '../../types/models';
import { Select } from '../../components/Select';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { toApiError } from '../../api/httpClient';
import { roomsApi } from '../../api/roomsApi';

export function CleaningPage() {
  const { ensure } = usePermissionCheck();
  const [rooms, setRooms] = useState<CleaningRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiRooms = await roomsApi.getAll();
      if (apiRooms.length > 0) {
        const mapped: CleaningRoom[] = apiRooms.map((room) => ({
          id: room.id,
          roomNumber: room.roomNumber,
          assignedTo: 'Team A',
          checklist: [
            { id: 'c1', label: 'Bed linen check', status: room.cleaningStatus === 'Dirty' ? 'Damaged' : 'Normal' },
            { id: 'c2', label: 'Bathroom amenities', status: 'Normal' },
            { id: 'c3', label: 'Minibar count', status: room.cleaningStatus === 'Dirty' ? 'Missing' : 'Normal' },
          ],
        }));
        setRooms(mapped);
        setActiveRoomId((prev) => (mapped.some((room) => room.id === prev) ? prev : (mapped[0]?.id ?? 0)));
      }
    } catch (error) {
      const apiError = toApiError(error);
      toast.error(apiError.message || 'Failed to load cleaning rooms');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const active = rooms.find((room) => room.id === activeRoomId) ?? rooms[0];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Rooms Requiring Cleaning</h2>
        <div className="mt-3 space-y-2">
          {rooms.map((room) => (
            <button
              type="button"
              key={room.id}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${activeRoomId === room.id ? 'border-cyan-200 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              onClick={() => setActiveRoomId(room.id)}
            >
              Room {room.roomNumber} - {room.assignedTo}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Checklist for Room {active?.roomNumber}</h3>
          <button
            type="button"
            className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => {
              if (!ensure('update_cleaning', 'complete room checklist')) {
                return;
              }
              if (!active) {
                return;
              }
              void (async () => {
                try {
                  if (active.id) {
                    await roomsApi.changeCleaningStatus(active.id, 'Clean');
                  }
                  setRooms((prev) =>
                    prev.map((room) =>
                      room.id === active.id
                        ? {
                          ...room,
                          checklist: room.checklist.map((item) => ({ ...item, status: 'Normal' })),
                        }
                        : room,
                    ),
                  );
                  toast.success('All checklist items marked complete');
                } catch (error) {
                  const apiError = toApiError(error);
                  toast.error(apiError.message || 'Failed to update cleaning status');
                }
              })();
            }}
          >
            Mark all complete
          </button>
        </div>

        <div className="space-y-2">
          {active?.checklist.map((item) => (
            <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_180px]">
              <p className="text-sm text-slate-700">{item.label}</p>
              <Select
                value={item.status}
                onChange={(e) => {
                  if (!ensure('update_cleaning', 'update checklist item')) {
                    return;
                  }
                  if (!active) {
                    return;
                  }
                  const status = e.target.value as CleaningCondition;
                  void (async () => {
                    try {
                      if (active.id) {
                        const nextCleaningStatus = status === 'Normal' ? 'Clean' : 'Dirty';
                        await roomsApi.changeCleaningStatus(active.id, nextCleaningStatus);
                      }
                      setRooms((prev) =>
                        prev.map((room) =>
                          room.id === active.id
                            ? {
                              ...room,
                              checklist: room.checklist.map((entry) => (entry.id === item.id ? { ...entry, status } : entry)),
                            }
                            : room,
                        ),
                      );
                      toast.success(`Checklist updated: ${status}`);
                    } catch (error) {
                      const apiError = toApiError(error);
                      toast.error(apiError.message || 'Failed to update checklist');
                    }
                  })();
                }}
              >
                <option>Normal</option>
                <option>Damaged</option>
                <option>Missing</option>
              </Select>
            </div>
          ))}
        </div>
        {!isLoading && rooms.length === 0 ? <p className="mt-3 text-xs text-slate-400">No rooms available for cleaning.</p> : null}
        {isLoading ? <p className="mt-3 text-xs text-slate-400">Loading rooms...</p> : null}
      </div>
    </div>
  );
}
