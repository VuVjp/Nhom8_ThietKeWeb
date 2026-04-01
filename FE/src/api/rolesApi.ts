import { httpClient } from './httpClient';
import type { RoleItem } from '../types/models';

export interface RoleDto {
    Id: number;
    Name: string;
    permissions: string[];
    Permissions?: string[];
}

export interface AssignPermissionPayload {
    roleId: number;
    permissionId: number;
}

export interface UpdateRolePermissionsPayload {
    permissionNames: string[];
}

export const rolesApi = {
    async getAll() {
        const { data } = await httpClient.get<RoleDto[]>('roles');
        return data.map(
            (item): RoleItem => ({
                id: item.Id,
                roleName: item.Name,
                permissions: item.Permissions ?? item.permissions ?? [],
            }),
        );
    },

    async getAllPermissions() {
        const { data } = await httpClient.get<string[]>('roles/permissions');
        return data;
    },

    async assignPermission(payload: AssignPermissionPayload) {
        await httpClient.post('roles/assign-permission', payload);
    },

    async updateRolePermissions(roleId: number, payload: UpdateRolePermissionsPayload) {
        await httpClient.put(`roles/${roleId}/permissions`, payload);
    },

    async getMyPermissions() {
        const { data } = await httpClient.get<string[]>('roles/my-permissions');
        return data;
    },
};
