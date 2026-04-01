import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notificationsApi, type NotificationDto } from '../api/notificationsApi';
import { getAccessToken } from '../api/httpClient';
import type { NotificationItem } from '../types/models';
import { toRoleName, type RoleName } from '../types/roleName';

interface NotificationEventPayload {
    title?: string;
    Title?: string;
    content?: string;
    Content?: string;
    createdAt?: string;
    CreatedAt?: string;
}

const PAGE_SIZE = 20;

function toNotificationItem(dto: NotificationDto): NotificationItem {
    const createdAt = String(dto.createdAt ?? dto.CreatedAt ?? new Date().toISOString());

    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        title: String(dto.title ?? dto.Title ?? 'Notification'),
        description: String(dto.content ?? dto.Content ?? ''),
        time: new Date(createdAt).toLocaleString(),
        read: Boolean(dto.isRead ?? dto.IsRead ?? false),
    };
}

function parseRoleFromToken(token: string | null): RoleName | null {
    if (!token) {
        return null;
    }

    try {
        const payloadPart = token.split('.')[1];
        if (!payloadPart) {
            return null;
        }

        const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(normalized)) as Record<string, unknown>;

        const rawRole =
            payload.role ??
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

        return toRoleName(String(rawRole ?? ''));
    } catch {
        return null;
    }
}

export function useRealtimeNotifications(enabled: boolean) {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const connectionRef = useRef<HubConnection | null>(null);
    const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tempIdRef = useRef(-1);

    const roleName = useMemo(() => parseRoleFromToken(getAccessToken()), [enabled]);

    const refreshUnreadCount = useCallback(async () => {
        try {
            const count = await notificationsApi.getUnreadCount();
            setUnreadCount(count);
        } catch {
            // Silent fallback to local count when endpoint temporarily fails.
        }
    }, []);

    const refreshNotifications = useCallback(async () => {
        setIsSyncing(true);
        try {
            const [page, count] = await Promise.all([
                notificationsApi.getMine(1, PAGE_SIZE),
                notificationsApi.getUnreadCount(),
            ]);

            const nextItems = page.items.map(toNotificationItem);
            setItems(nextItems);
            setUnreadCount(count);
            setCurrentPage(1);
            setHasMore(page.page * page.pageSize < page.total);
        } finally {
            setIsSyncing(false);
        }
    }, []);

    const scheduleSync = useCallback(() => {
        if (syncTimerRef.current) {
            clearTimeout(syncTimerRef.current);
        }

        syncTimerRef.current = setTimeout(() => {
            void refreshNotifications();
        }, 1200);
    }, [refreshNotifications]);

    const handleRealtimeEvent = useCallback((payload: NotificationEventPayload) => {
        const createdAt = String(payload.createdAt ?? payload.CreatedAt ?? new Date().toISOString());
        const title = String(payload.title ?? payload.Title ?? 'Notification');
        const content = String(payload.content ?? payload.Content ?? '');

        const realtimeItem: NotificationItem = {
            id: tempIdRef.current,
            title,
            description: content,
            time: new Date(createdAt).toLocaleString(),
            read: false,
        };

        tempIdRef.current -= 1;
        setItems((prev) => [realtimeItem, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Refetch only when a new message arrives, with debounce to prevent spam calls.
        scheduleSync();
    }, [scheduleSync]);

    useEffect(() => {
        if (!enabled) {
            setItems([]);
            setUnreadCount(0);
            setCurrentPage(1);
            setHasMore(false);
            setIsLoadingMore(false);
            return;
        }

        void refreshNotifications();

        const connection = new HubConnectionBuilder()
            .withUrl('http://localhost:5082/hubs/notification', {
                accessTokenFactory: () => getAccessToken() ?? '',
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();

        connection.on('ReceiveNotification', handleRealtimeEvent);

        connection.onreconnected(() => {
            // Special case: reconnect should sync once to catch up missed messages.
            void refreshNotifications();
        });

        connectionRef.current = connection;

        void connection.start().catch(() => {
            // SignalR startup failure should not block the app; manual endpoints still work.
        });

        return () => {
            if (syncTimerRef.current) {
                clearTimeout(syncTimerRef.current);
                syncTimerRef.current = null;
            }

            connection.off('ReceiveNotification', handleRealtimeEvent);
            if (connection.state !== HubConnectionState.Disconnected) {
                void connection.stop();
            }
            connectionRef.current = null;
        };
    }, [enabled, handleRealtimeEvent, refreshNotifications]);

    const markRead = useCallback((id: number) => {
        const target = items.find((item) => item.id === id);
        const wasUnread = Boolean(target && !target.read);

        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
        if (wasUnread) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        if (id <= 0) {
            return;
        }

        void notificationsApi.markAsRead(id).catch(() => {
            if (wasUnread) {
                setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: false } : item)));
                setUnreadCount((prev) => prev + 1);
            }

            // Keep the badge aligned with backend truth after failure.
            void refreshUnreadCount();
        });
    }, [items, refreshUnreadCount]);

    const markAllRead = useCallback(() => {
        if (unreadCount <= 0) {
            return;
        }

        const previousItems = items;
        const previousUnread = unreadCount;

        setItems((prev) => prev.map((item) => ({ ...item, read: true })));
        setUnreadCount(0);

        void notificationsApi.markAllAsRead()
            .then(() => {
                // Sync full list and unread count from server so UI stays consistent.
                void refreshNotifications();
            })
            .catch(() => {
                setItems(previousItems);
                setUnreadCount(previousUnread);
                void refreshUnreadCount();
            });
    }, [items, unreadCount, refreshNotifications, refreshUnreadCount]);

    const loadMore = useCallback(async () => {
        if (!enabled || isLoadingMore || !hasMore) {
            return;
        }

        const nextPage = currentPage + 1;
        setIsLoadingMore(true);

        try {
            const page = await notificationsApi.getMine(nextPage, PAGE_SIZE);
            const nextItems = page.items.map(toNotificationItem);

            setItems((prev) => {
                const seen = new Set(prev.map((item) => item.id));
                const deduped = nextItems.filter((item) => !seen.has(item.id));
                return [...prev, ...deduped];
            });

            setCurrentPage(page.page);
            setHasMore(page.page * page.pageSize < page.total);
        } finally {
            setIsLoadingMore(false);
        }
    }, [enabled, isLoadingMore, hasMore, currentPage]);

    return {
        notifications: items,
        unreadCount,
        isSyncing,
        hasMore,
        isLoadingMore,
        roleName,
        markRead,
        markAllRead,
        loadMore,
    };
}
