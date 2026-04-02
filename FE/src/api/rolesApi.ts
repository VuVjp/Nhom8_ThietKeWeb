import { httpClient } from './httpClient';
import type { RoleItem } from '../types/models';

const legacyPermissionMap: Record<string, string[]> = {
    MANAGE_USERS: ['manage_user'],
    CREATE_USERS: ['manage_user'],
    UPDATE_USERS: ['manage_user'],
    DELETE_USERS: ['manage_user'],
    MANAGE_ROLES: ['manage_role'],
    MANAGE_ROOMS: [
        'get_all_rooms',
        'create_room',
        'update_room',
        'delete_room',
        'change_room_status',
        'change_room_cleaning_status',
        'manage_room_type',
        'get_all_room_inventory',
        'create_room_inventory',
        'update_room_inventory',
        'delete_room_inventory',
    ],
    MANAGE_EQUIPMENTS: ['create_amenity', 'update_amenity', 'delete_amenity'],
};

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

        if (/^[a-z0-9_]+$/.test(trimmed)) {
            normalized.add(trimmed);
            continue;
        }

        const mapped = legacyPermissionMap[trimmed.toUpperCase()];
        if (mapped) {
            mapped.forEach((permission) => normalized.add(permission));
        }
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
