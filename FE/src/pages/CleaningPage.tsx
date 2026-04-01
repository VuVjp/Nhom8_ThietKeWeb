import { useState } from 'react';
import toast from 'react-hot-toast';
import { cleaningRoomsSeed } from '../mock/data';
import type { CleaningCondition, CleaningRoom } from '../types/models';
import { Select } from '../components/Select';
import { usePermissionCheck } from '../hooks/usePermissionCheck';

export function CleaningPage() {
  const { ensure } = usePermissionCheck();
  const [rooms, setRooms] = useState<CleaningRoom[]>(cleaningRoomsSeed);
  const [activeRoomId, setActiveRoomId] = useState<number>(cleaningRoomsSeed[0]?.id ?? 0);
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
              setRooms((prev) =>
                prev.map((room) =>
                  room.id === active?.id
                    ? {
                      ...room,
                      checklist: room.checklist.map((item) => ({ ...item, status: 'Normal' })),
                    }
                    : room,
                ),
              );
              toast.success('All checklist items marked complete');
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
                  const status = e.target.value as CleaningCondition;
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
                }}
              >
                <option>Normal</option>
                <option>Damaged</option>
                <option>Missing</option>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
