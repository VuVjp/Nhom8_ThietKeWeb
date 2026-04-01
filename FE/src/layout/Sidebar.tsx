import { HomeIcon, BuildingOffice2Icon, ArchiveBoxIcon, ExclamationTriangleIcon, SparklesIcon, UsersIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import type { AppPermission } from '../auth/appAuth';
import { useAppAuth } from '../auth/appAuth';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon, permission: 'view_dashboard' as AppPermission },
  { to: '/admin/rooms', label: 'Rooms', icon: BuildingOffice2Icon, permission: 'view_rooms' as AppPermission },
  { to: '/admin/inventory', label: 'Inventory', icon: ArchiveBoxIcon, permission: 'manage_inventory' as AppPermission },
  { to: '/admin/loss', label: 'Loss & Compensation', icon: ExclamationTriangleIcon, permission: 'approve_loss' as AppPermission },
  { to: '/admin/cleaning', label: 'Cleaning', icon: SparklesIcon, permission: 'update_cleaning' as AppPermission },
  { to: '/admin/users', label: 'Users', icon: UsersIcon, permission: 'manage_users' as AppPermission },
  { to: '/admin/roles', label: 'Roles', icon: ShieldCheckIcon, permission: 'manage_roles' as AppPermission },
];

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { hasPermission } = useAppAuth();

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-900/40 lg:hidden ${mobileOpen ? 'block' : 'hidden'}`} onClick={onCloseMobile} />
      <aside
        className={`fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white shadow-sm transition-all lg:static lg:block ${collapsed ? 'w-20' : 'w-72'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-4">
          <div className="rounded-lg bg-cyan-600/10 px-2 py-1 text-xs font-bold text-cyan-700">CG</div>
          {!collapsed ? <h1 className="ml-2 text-sm font-semibold text-slate-800">Celestia Grand Admin</h1> : null}
        </div>
        <nav className="space-y-1 p-3">
          {navItems.filter((item) => hasPermission(item.permission)).map((item) => {
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
