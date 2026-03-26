import type { UpsertUserPayload, User } from '../types/user';
import { normalizePaginatedResponse } from '../utils/pagination';
import { apiClient } from './axiosClient';

export interface CreateUserRequest {
    email: string;
    password: string;
    roleId: number;
}

export interface UsersQueryParams {
    page: number;
    pageSize: number;
    search?: string;
    role?: string;
    isActive?: boolean;
}

interface BackendUserDto {
    id?: number | string;
    fullName?: string | null;
    email?: string | null;
    role?: string | null;
    roleName?: string | null;
    isActive?: boolean | null;
}

const toUserModel = (item: BackendUserDto): User => ({
    id: String(item.id ?? ''),
    fullName: item.fullName ?? '',
    email: item.email ?? '',
    role: (item.role ?? item.roleName ?? 'Staff') as User['role'],
    isActive: item.isActive ?? true,
});

export const usersService = {
    list: async ({ page, pageSize, search, role, isActive }: UsersQueryParams) => {
        const { data } = await apiClient.get<unknown>('/UserManagement', {
            params: { page, pageSize, search, role, isActive },
        });

        return normalizePaginatedResponse<BackendUserDto, User>(data, {
            page,
            pageSize,
            search,
            mapper: toUserModel,
            filterPredicate: (item) => {
                const matchRole = !role || item.role === role;
                const matchActive = isActive === undefined || item.isActive === isActive;
                return matchRole && matchActive;
            },
            searchPredicate: (item, keyword) =>
                item.fullName.toLowerCase().includes(keyword) || item.email.toLowerCase().includes(keyword),
        });
    },
    create: async (payload: CreateUserRequest) => {
        await apiClient.post('/UserManagement', payload);
    },
    update: async (userId: string, payload: UpsertUserPayload) => {
        const { data } = await apiClient.put<User>(`/UserManagement/${userId}`, payload);
        return data;
    },
    toggleActive: async (userId: string) => {
        await apiClient.patch(`/UserManagement/${userId}/toggle-active`);
    },
    resetPassword: async (userId: string) => {
        await apiClient.post(`/UserManagement/${userId}/reset-password`);
    },
    assignRole: async (userId: string, roleId: number) => {
        await apiClient.put(`/UserManagement/${userId}/change-role`, { roleId });
    },
};
