import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { NotificationItem } from '../types/models';
import { useAppAuth } from '../auth/useAppAuth';

export function AppLayout() {
    const { user, logout } = useAppAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="flex min-h-screen  sticky top-0">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    mobileOpen={mobileOpen}
                    onCloseMobile={() => setMobileOpen(false)}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                    <Header
                        onSidebarToggle={() => setSidebarCollapsed((prev) => !prev)}
                        onMobileToggle={() => setMobileOpen((prev) => !prev)}
                        onSearchChange={setSearch}
                        notifications={notifications}
                        user={user}
                        onSignOut={logout}
                        onMarkRead={(id) => setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)))}
                        onMarkAllRead={() => setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))}
                    />
                    <main className="flex-1 p-4 lg:p-6">
                        <Outlet context={{ globalSearch: search }} />
                    </main>
                </div>
            </div>
        </div>
    );
}
