import { HomeIcon, BuildingOffice2Icon, ArchiveBoxIcon, ExclamationTriangleIcon, SparklesIcon, UsersIcon, ShieldCheckIcon, WrenchScrewdriverIcon, Squares2X2Icon, RectangleStackIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import type { AppPermission } from '../auth/auth.types';
import { useAppAuth } from '../auth/useAppAuth';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface SidebarNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions?: AppPermission[];
}

const navItems: SidebarNavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon, permissions: ['VIEW_DASHBOARD'] as AppPermission[] },
  { to: '/admin/rooms', label: 'Rooms', icon: BuildingOffice2Icon, permissions: ['MANAGE_ROOMS'] as AppPermission[] },
  { to: '/admin/room-types', label: 'Room Types', icon: RectangleStackIcon, permissions: ['MANAGE_ROOM_TYPES'] as AppPermission[] },
  { to: '/admin/inventory', label: 'Inventory', icon: ArchiveBoxIcon, permissions: ['MANAGE_INVENTORY'] as AppPermission[] },
  { to: '/admin/amenities', label: 'Amenities', icon: Squares2X2Icon, permissions: ['MANAGE_AMENITY'] as AppPermission[] },
  { to: '/admin/equipments', label: 'Equipments', icon: WrenchScrewdriverIcon, permissions: ['MANAGE_EQUIPMENTS'] as AppPermission[] },
  { to: '/admin/loss', label: 'Loss & Compensation', icon: ExclamationTriangleIcon, permissions: ['APPROVE_LOSS'] as AppPermission[] },
  { to: '/admin/cleaning', label: 'Cleaning', icon: SparklesIcon, permissions: ['UPDATE_CLEANING'] as AppPermission[] },
  { to: '/admin/users', label: 'Users', icon: UsersIcon, permissions: ['MANAGE_USERS'] as AppPermission[] },
  { to: '/admin/roles', label: 'Roles', icon: ShieldCheckIcon, permissions: ['MANAGE_ROLES'] as AppPermission[] },
];

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { hasPermission } = useAppAuth();

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-900/40 lg:hidden ${mobileOpen ? 'block' : 'hidden'}`} onClick={onCloseMobile} />
      <aside
        className={`fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white shadow-sm transition-all lg:sticky lg:top-0 lg:block ${collapsed ? 'w-20' : 'w-72'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-4">
          <div className="rounded-lg bg-cyan-600/10 px-2 py-1 text-xs font-bold text-cyan-700">CG</div>
          {!collapsed ? <h1 className="ml-2 text-sm font-semibold text-slate-800">Celestia Grand Admin</h1> : null}
        </div>
        <nav className="h-[calc(100vh-4rem)] space-y-1 overflow-y-auto p-3">
          {navItems.filter((item) => !item.permissions || item.permissions.some((permission) => hasPermission(permission))).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`
                }
              >
                <Icon className="h-5 w-5" />
                {!collapsed ? <span>{item.label}</span> : null}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
