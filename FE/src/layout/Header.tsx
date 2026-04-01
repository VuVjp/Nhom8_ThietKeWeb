import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { NotificationBell } from '../components/NotificationBell';
import type { NotificationItem } from '../types/models';
import { Input } from '../components/Input';
import type { AppUser } from '../auth/appAuth';

interface HeaderProps {
  onSidebarToggle: () => void;
  onMobileToggle: () => void;
  onSearchChange: (value: string) => void;
  notifications: NotificationItem[];
  user: AppUser | null;
  onSignOut: () => void;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
}

export function Header({ onSidebarToggle, onMobileToggle, onSearchChange, notifications, user, onSignOut, onMarkRead, onMarkAllRead }: HeaderProps) {
  const navigate = useNavigate();
  const initial = user?.name?.charAt(0).toUpperCase() ?? 'U';

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden" onClick={onMobileToggle}>
            <Bars3Icon className="h-5 w-5" />
          </button>
          <button type="button" className="hidden rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:block" onClick={onSidebarToggle}>
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="relative hidden w-72 md:block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <Input placeholder="Search rooms, inventory, users" className="pl-10" onChange={(e) => onSearchChange(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell notifications={notifications} onMarkRead={onMarkRead} onMarkAllRead={onMarkAllRead} />

          <Menu as="div" className="relative">
            <MenuButton className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm hover:bg-slate-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">{initial}</div>
              <span className="hidden md:block">{user?.name ?? 'User'}</span>
            </MenuButton>
            <MenuItems anchor="bottom end" className="z-30 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
              <MenuItem>
                {({ focus }) => <button type="button" className={`w-full rounded-lg px-3 py-2 text-left text-sm ${focus ? 'bg-slate-100' : ''}`}>{user?.role ?? 'Role'}</button>}
              </MenuItem>
              <MenuItem>
                {({ focus }) => <button type="button" className={`w-full rounded-lg px-3 py-2 text-left text-sm ${focus ? 'bg-slate-100' : ''}`}>{user?.email ?? 'No email'}</button>}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 ${focus ? 'bg-rose-50' : ''}`}
                    onClick={() => {
                      onSignOut();
                      toast.success('Signed out');
                      navigate('/admin/login', { replace: true });
                    }}
                  >
                    Sign out
                  </button>
                )}
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </header>
  );
}
