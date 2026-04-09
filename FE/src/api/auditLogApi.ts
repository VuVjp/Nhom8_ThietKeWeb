import { httpClient } from './httpClient';

export type AuditLogAction =
    | 'Create'
    | 'Update'
    | 'Delete'
    | 'Login'
    | 'Logout'
    | 'StatusChange'
    | 'Other';

export interface AuditLog {
    id: number;
    userId?: number;
    userName: string;
    userEmail: string;
    action: AuditLogAction | string;
    entityType: string;
    entityId?: string;
    description: string;
    ipAddress?: string;
    createdAt: string;
}

export interface AuditLogFilters {
    userId?: number;
    action?: string;
    entityType?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
}

export interface AuditLogPagedResult {
    items: AuditLog[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export const auditLogApi = {
    async getAll(filters?: AuditLogFilters): Promise<AuditLog[]> {
        const { data } = await httpClient.get<AuditLog[]>('/AuditLogs', { params: filters });
        return data;
    },

    async getPaged(filters?: AuditLogFilters): Promise<AuditLogPagedResult> {
        const { data } = await httpClient.get<AuditLogPagedResult>('/AuditLogs/paged', { params: filters });
        return data;
    },
};
