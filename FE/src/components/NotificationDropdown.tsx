import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import type { NotificationItem } from '../types/models';

interface NotificationDropdownProps {
  items: NotificationItem[];
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
}

export function NotificationDropdown({ items, onMarkRead, onMarkAllRead }: NotificationDropdownProps) {
  const unreadCount = items.filter((item) => !item.read).length;

  return (
    <Popover className="relative">
      <PopoverButton className="relative rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
        <BellIcon className="h-5 w-5 text-slate-700" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </PopoverButton>

      <PopoverPanel anchor="bottom end" className="z-30 mt-2 w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-800">Notifications</h4>
          <button type="button" onClick={onMarkAllRead} className="text-xs text-slate-500 hover:text-slate-700">
            Mark all as read
          </button>
        </div>

        <div className="max-h-80 space-y-2 overflow-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-100 p-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{item.time}</p>
                </div>
                {!item.read ? (
                  <button type="button" onClick={() => onMarkRead(item.id)} className="text-[11px] text-cyan-700 hover:text-cyan-800">
                    Mark as read
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </PopoverPanel>
    </Popover>
  );
}
