import type { RoleModel, UpsertRolePayload } from '../types/role';
import { normalizePaginatedResponse } from '../utils/pagination';
import { apiClient } from './axiosClient';

interface BackendRoleDto {
    id?: number | string;
    name?: string | null;
    permissions?: string[] | null;
}

const toRoleModel = (item: BackendRoleDto): RoleModel => ({
    id: String(item.id ?? ''),
    name: (item.name ?? 'Staff') as RoleModel['name'],
    permissions: (item.permissions ?? []) as RoleModel['permissions'],
});

export const rolesService = {
    list: async (page = 1, pageSize = 10) => {
        const { data } = await apiClient.get<unknown>('/Roles', {
            params: { page, pageSize },
        });

        return normalizePaginatedResponse<BackendRoleDto, RoleModel>(data, {
            page,
            pageSize,
            mapper: toRoleModel,
            searchPredicate: (item, keyword) => item.name.toLowerCase().includes(keyword),
        });
    },
    create: async (payload: UpsertRolePayload) => {
        const { data } = await apiClient.post<RoleModel>('/Roles', payload);
        return data;
    },
    update: async (roleId: string, payload: UpsertRolePayload) => {
        const { data } = await apiClient.put<RoleModel>(`/Roles/${roleId}`, payload);
        return data;
    },
    remove: async (roleId: string) => {
        await apiClient.delete(`/Roles/${roleId}`);
    },
    getAllPermissions: async () => {
        const { data } = await apiClient.get<string[]>('/Roles/permissions');
        return data;
    },
    updatePermissions: async (roleId: string, permissions: string[]) => {
        await apiClient.put(`/Roles/${roleId}/permissions`, { permissionNames: permissions });
    },
};
