export interface NotificationItem {
    id: number;
    title: string;
    content: string;
    type?: string | null;
    referenceLink?: string | null;
    isRead: boolean;
    createdAt?: string | null;
}
