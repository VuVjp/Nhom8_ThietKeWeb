import { httpClient } from './httpClient';

interface PaginatedNotificationsResponse<TItem> {
    items?: TItem[];
    Items?: TItem[];
    total?: number;
    Total?: number;
    page?: number;
    Page?: number;
    pageSize?: number;
    PageSize?: number;
}

export interface NotificationDto {
    id?: number;
    Id?: number;
    title?: string;
    Title?: string;
    content?: string;
    Content?: string;
    type?: string;
    Type?: string;
    referenceLink?: string;
    ReferenceLink?: string;
    isRead?: boolean;
    IsRead?: boolean;
    createdAt?: string;
    CreatedAt?: string;
}

export interface NotificationPageResult {
    items: NotificationDto[];
    total: number;
    page: number;
    pageSize: number;
}

export const notificationsApi = {
    async getMine(page = 1, pageSize = 20): Promise<NotificationPageResult> {
        const { data } = await httpClient.get<PaginatedNotificationsResponse<NotificationDto>>('notifications/me', {
            params: { page, pageSize },
        });

        return {
            items: data.items ?? data.Items ?? [],
            total: Number(data.total ?? data.Total ?? 0),
            page: Number(data.page ?? data.Page ?? page),
            pageSize: Number(data.pageSize ?? data.PageSize ?? pageSize),
        };
    },

    async getUnreadCount(): Promise<number> {
        const { data } = await httpClient.get<{ count?: number; Count?: number }>('notifications/unread-count');
        return Number(data.count ?? data.Count ?? 0);
    },

    async markAllAsRead() {
        await httpClient.post('notifications/mark-all-as-read');
    },

    async markAsRead(notificationId: number) {
        await httpClient.patch(`notifications/${notificationId}/read`);
    },
};
