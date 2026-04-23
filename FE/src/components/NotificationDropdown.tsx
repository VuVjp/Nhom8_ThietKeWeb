import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import type { NotificationItem } from '../types/models';

interface NotificationDropdownProps {
  items: NotificationItem[];
  unreadCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onLoadMore: () => void;
}

export function NotificationDropdown({ items, unreadCount, hasMore, isLoadingMore, onMarkRead, onMarkAllRead, onLoadMore }: NotificationDropdownProps) {

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

      <PopoverPanel anchor="bottom end" className="z-30 mt-2 w-96 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-base font-bold text-slate-800">Notifications</h4>
          <button 
            type="button" 
            onClick={onMarkAllRead} 
            className="whitespace-nowrap rounded-lg bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Mark all as read
          </button>
        </div>

        <div className="max-h-96 space-y-3 overflow-auto pr-1 custom-scrollbar">
          {items.map((item) => (
            <div 
              key={item.id} 
              className={`group relative rounded-xl border p-3 transition-all ${
                !item.read 
                  ? 'border-cyan-100 bg-cyan-50/40 shadow-sm' 
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${!item.read ? 'text-slate-900' : 'text-slate-700'}`}>
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                  <p className="mt-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    {item.time}
                  </p>
                </div>
                {!item.read && (
                  <button 
                    type="button" 
                    onClick={() => onMarkRead(item.id)} 
                    className="shrink-0 rounded-md bg-white border border-cyan-200 px-2 py-1 text-[10px] font-bold text-cyan-700 hover:bg-cyan-50 transition shadow-sm"
                  >
                    Mark read
                  </button>
                )}
              </div>
              {!item.read && (
                <div className="absolute left-1 top-1 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
                </div>
              )}
            </div>
          ))}

          {items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-slate-400">No notifications yet.</p>
            </div>
          ) : null}
        </div>

        {hasMore ? (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 shadow-md"
            >
              {isLoadingMore ? 'Loading...' : 'View Older Notifications'}
            </button>
          </div>
        ) : null}
      </PopoverPanel>
    </Popover>
  );
}
