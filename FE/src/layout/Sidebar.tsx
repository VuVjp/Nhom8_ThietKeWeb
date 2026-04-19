import { useState } from 'react';
import { HomeIcon, BuildingOffice2Icon, ArchiveBoxIcon, ExclamationTriangleIcon, SparklesIcon, UsersIcon, ShieldCheckIcon, WrenchScrewdriverIcon, Squares2X2Icon, RectangleStackIcon, ChevronDownIcon, CalendarDaysIcon, TicketIcon } from '@heroicons/react/24/outline';
import { NavLink, useLocation } from 'react-router-dom';
import type { AppPermission } from '../auth/auth.types';
import { useAppAuth } from '../auth/useAppAuth';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface SidebarNavItem {
  to?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions?: AppPermission[];
  children?: {
    to: string;
    label: string;
    permissions?: AppPermission[];
  }[];
}

const navItems: SidebarNavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon, permissions: ['VIEW_DASHBOARD'] as AppPermission[] },
  {
    label: 'Reception',
    icon: CalendarDaysIcon,
    permissions: ['MANAGE_BOOKINGS'] as AppPermission[],
    children: [
      { to: '/admin/reception/create-booking', label: 'Create Booking', permissions: ['MANAGE_BOOKINGS'] as AppPermission[] },
      { to: '/admin/reception/arrivals', label: 'Arrivals Today', permissions: ['MANAGE_BOOKINGS'] as AppPermission[] },
      { to: '/admin/reception/in-house', label: 'In-House Guests', permissions: ['MANAGE_BOOKINGS'] as AppPermission[] },
      { to: '/admin/reception/bookings', label: 'All Bookings', permissions: ['MANAGE_BOOKINGS'] as AppPermission[] },
      { to: '/admin/reception/order-services', label: 'Service Orders', permissions: ['MANAGE_SERVICES'] as AppPermission[] },
      { to: '/admin/invoices', label: 'Invoices', permissions: ['MANAGE_BOOKINGS'] as AppPermission[] },
    ]
  },
  {
    label: 'Services',
    icon: CubeIcon,
    permissions: ['MANAGE_SERVICES'] as AppPermission[],
    children: [
      { to: '/admin/services', label: 'Service Catalog', permissions: ['MANAGE_SERVICES'] as AppPermission[] },
      { to: '/admin/service-categories', label: 'Categories', permissions: ['MANAGE_SERVICES'] as AppPermission[] },
    ]
  },
  { to: '/admin/rooms', label: 'Rooms', icon: BuildingOffice2Icon, permissions: ['MANAGE_ROOMS'] as AppPermission[] },
  { to: '/admin/room-types', label: 'Room Types', icon: RectangleStackIcon, permissions: ['MANAGE_ROOM_TYPES'] as AppPermission[] },
  { to: '/admin/inventory', label: 'Inventory', icon: ArchiveBoxIcon, permissions: ['MANAGE_INVENTORY'] as AppPermission[] },
  { to: '/admin/amenities', label: 'Amenities', icon: Squares2X2Icon, permissions: ['MANAGE_AMENITY'] as AppPermission[] },
  { to: '/admin/equipments', label: 'Equipments', icon: WrenchScrewdriverIcon, permissions: ['MANAGE_EQUIPMENTS'] as AppPermission[] },
  { to: '/admin/loss', label: 'Loss & Compensation', icon: ExclamationTriangleIcon, permissions: ['APPROVE_LOSS'] as AppPermission[] },
  { to: '/admin/cleaning', label: 'Inspecting & Cleaning', icon: SparklesIcon, permissions: ['UPDATE_CLEANING'] as AppPermission[] },
  { to: '/admin/vouchers', label: 'Vouchers', icon: TicketIcon, permissions: ['MANAGE_VOUCHERS'] as AppPermission[] },
  { to: '/admin/users', label: 'Users', icon: UsersIcon, permissions: ['MANAGE_USERS'] as AppPermission[] },
  { to: '/admin/roles', label: 'Roles', icon: ShieldCheckIcon, permissions: ['MANAGE_ROLES'] as AppPermission[] },
  { to: '/admin/audit-log', label: 'Audit Logs', icon: Squares2X2Icon, permissions: ['VIEW_DASHBOARD'] as AppPermission[] },
  { to: '/admin/reviews', label: 'Reviews', icon: StarIcon, permissions: ['MANAGE_REVIEWS'] as AppPermission[] },
];

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { hasPermission } = useAppAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 'Reception': true });

  useEffect(() => {
    let changed = false;
    const nextOpen = { ...openGroups };

    navItems.forEach((item) => {
      if (item.children && !nextOpen[item.label]) {
        const hasActiveChild = item.children.some((child) => location.pathname.startsWith(child.to));
        if (hasActiveChild) {
          nextOpen[item.label] = true;
          changed = true;
        }
      }
    });

    if (changed) {
      setOpenGroups(nextOpen);
    }
  }, [location.pathname]);
  const toggleGroup = (label: string) => {
    if (collapsed) return;
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-900/40 lg:hidden ${mobileOpen ? 'block' : 'hidden'}`} onClick={onCloseMobile} />
      <aside
        className={`fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white shadow-sm transition-all lg:sticky lg:top-0 lg:block ${collapsed ? 'w-20' : 'w-72'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-4">
          <div className="rounded-lg bg-cyan-600/10 px-2 py-1 text-xs font-bold text-cyan-700">CG</div>
          {!collapsed ? <h1 className="ml-2 text-sm font-semibold text-slate-800">Admin</h1> : null}
        </div>
        <nav className="h-[calc(100vh-4rem)] space-y-1 overflow-y-auto p-3">
          {navItems.filter((item) => !item.permissions || item.permissions.some((permission) => hasPermission(permission))).map((item) => {
            const Icon = item.icon;

            if (item.children) {
              const isOpen = openGroups[item.label] && !collapsed;
              const hasActiveChild = item.children.some(child => location.pathname.startsWith(child.to));

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.label)}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${hasActiveChild && !isOpen ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${hasActiveChild && !isOpen ? 'text-cyan-700' : ''}`} />
                      {!collapsed ? <span>{item.label}</span> : null}
                    </div>
                    {!collapsed && (
                      <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                  {isOpen && !collapsed && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                      {item.children.filter((child) => !child.permissions || child.permissions.some((permission) => hasPermission(permission))).map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive ? 'font-semibold text-cyan-700' : 'font-medium text-slate-500 hover:text-slate-800'}`
                          }
                        >
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to || item.label}
                to={item.to!}
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
