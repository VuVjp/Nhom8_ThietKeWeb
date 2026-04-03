import { httpClient } from './httpClient';
import type { RoleItem } from '../types/models';

function normalizePermissions(values: string[] | null | undefined): string[] {
    if (!values?.length) {
        return [];
    }

    const normalized = new Set<string>();

    for (const value of values) {
        const trimmed = value.trim();
        if (!trimmed) {
            continue;
        }

        normalized.add(trimmed.toUpperCase());
    }

    return Array.from(normalized);
}

export interface RoleDto {
    Id?: number;
    id?: number;
    Name?: string;
    name?: string;
    permissions?: string[];
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
                id: Number(item.Id ?? item.id ?? 0),
                name: item.Name ?? item.name ?? `Role ${item.Id ?? item.id ?? ''}`,
                permissions: normalizePermissions(item.Permissions ?? item.permissions ?? []),
            }),
        );
    },

    async getAllPermissions() {
        const { data } = await httpClient.get<string[]>('roles/permissions');
        return normalizePermissions(data);
    },

    async assignPermission(payload: AssignPermissionPayload) {
        await httpClient.post('roles/assign-permission', payload);
    },

    async updateRolePermissions(roleId: number, payload: UpdateRolePermissionsPayload) {
        await httpClient.put(`roles/${roleId}/permissions`, {
            permissionNames: normalizePermissions(payload.permissionNames),
        });
    },

    async getMyPermissions() {
        const { data } = await httpClient.get<string[]>('roles/my-permissions');
        return normalizePermissions(data);
    },
};
