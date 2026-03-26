import type { NotificationItem } from '../types/notification';
import { apiClient } from './axiosClient';

interface BackendNotificationDto {
    id?: number;
    title?: string | null;
    content?: string | null;
    type?: string | null;
    referenceLink?: string | null;
    isRead?: boolean;
    createdAt?: string | null;
}

interface BackendNotificationPageDto {
    items?: BackendNotificationDto[];
    total?: number;
    page?: number;
    pageSize?: number;
}

export interface NotificationPageResult {
    items: NotificationItem[];
    total: number;
    page: number;
    pageSize: number;
}

const toNotificationItem = (item: BackendNotificationDto): NotificationItem => ({
    id: item.id ?? 0,
    title: item.title ?? '',
    content: item.content ?? '',
    type: item.type,
    referenceLink: item.referenceLink,
    isRead: item.isRead ?? false,
    createdAt: item.createdAt,
});

export const notificationService = {
    listMine: async (page = 1, pageSize = 20): Promise<NotificationPageResult> => {
        const { data } = await apiClient.get<BackendNotificationPageDto>('/Notifications/me', {
            params: { page, pageSize },
        });

        return {
            items: (data.items ?? []).map(toNotificationItem),
            total: data.total ?? 0,
            page: data.page ?? page,
            pageSize: data.pageSize ?? pageSize,
        };
    },
    countUnread: async () => {
        const { data } = await apiClient.get<{ count?: number } | number>('/Notifications/unread-count');

        if (typeof data === 'number') {
            return data;
        }

        return data.count ?? 0;
    },
    markAsRead: async (notificationId: number) => {
        await apiClient.patch(`/Notifications/${notificationId}/read`);
    },
};
