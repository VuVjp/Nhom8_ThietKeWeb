import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppAuth } from '../auth/useAppAuth';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';

export function AdminLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [search, setSearch] = useState('');
    const { user, logout, isAuthenticated } = useAppAuth();
    const { notifications, unreadCount, hasMore, isLoadingMore, markRead, markAllRead, loadMore } = useRealtimeNotifications(isAuthenticated);

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="flex min-h-screen">
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
                        unreadCount={unreadCount}
                        hasMoreNotifications={hasMore}
                        isLoadingMoreNotifications={isLoadingMore}
                        user={user}
                        onSignOut={logout}
                        onMarkRead={markRead}
                        onMarkAllRead={markAllRead}
                        onLoadMoreNotifications={loadMore}
                    />
                    <main className="flex-1 p-4 lg:p-6">
                        <Outlet context={{ globalSearch: search }} />
                    </main>
                </div>
            </div>
        </div>
    );
}
