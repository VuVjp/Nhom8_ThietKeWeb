import { httpClient } from './httpClient';

export type AuditActionType =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'STATUS_CHANGE'
    | 'OTHER';

export interface AuditLogChanges {
    oldData: unknown;
    newData: unknown;
}

export interface AuditLogEvent {
    eventId: string;
    timestamp: string;
    actionType: AuditActionType | string;
    entityType: string;
    context: Record<string, unknown>;
    changes: AuditLogChanges;
    message: string;
}

export interface AuditLogDailyGroup {
    date: string;
    userId: number | null;
    totalEvents: number;
    events: AuditLogEvent[];
}

export interface AuditLogFilters {
    actionType?: string;
    entityType?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}

export interface AuditLogPagedResult {
    items: AuditLogDailyGroup[];
    totalCount: number;
    page: number;
    pageSize: number;
}

interface AuditLogPagedApiResult {
    items: AuditLogDailyGroup[];
    total: number;
    page: number;
    pageSize: number;
}

export const auditLogApi = {
    async getAll(filters?: AuditLogFilters): Promise<AuditLogDailyGroup[]> {
        const { data } = await httpClient.get<AuditLogDailyGroup[]>('/AuditLogs', { params: filters });
        return data;
    },

    async getPaged(filters?: AuditLogFilters): Promise<AuditLogPagedResult> {
        const { data } = await httpClient.get<AuditLogPagedApiResult>('/AuditLogs/paged', { params: filters });
        return {
            items: data.items,
            totalCount: data.total,
            page: data.page,
            pageSize: data.pageSize,
        };
    },
};
