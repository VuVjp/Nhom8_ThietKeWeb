import type { UserItem } from '../types/models';
import { httpClient } from './httpClient';

interface UserDto {
    id: number;
    Email?: string;
    email?: string;
    RoleName?: string;
    roleName?: string;
    isActive?: boolean;
    FullName?: string;
}

export interface CreateUserPayload {
    email: string;
    password: string;
    roleId: number;
}

export interface EditUserPayload {
    email: string;
    password?: string;
    roleId: number;
}

export interface ChangeRolePayload {
    roleId: number;
}

export type AppRoleName = UserItem['roleName'];

const roleIdMap: Record<AppRoleName, number> = {
    Admin: 1,
    Manager: 2,
    Receptionist: 3,
    Accountant: 4,
    Housekeeping: 5,
    Guest: 6,
    Maintenance: 7,
    Security: 8,
};

function normalizeRole(roleName?: string): AppRoleName {
    const role = (roleName ?? '').toLowerCase();
    if (role.includes('manager')) {
        return 'Manager';
    }
    if (role.includes('staff')) {
        return 'Staff';
    }
    return 'Admin';
}

function mapUserDtoToItem(dto: UserDto): UserItem {
    const email = dto.email ?? 'unknown@hotel-admin.com';
    const normalizedRole = dto.roleName || normalizeRole(dto.roleName);
    return {
        id: dto.id,
        name: dto.FullName?.trim() || email.split('@')[0],
        email,
        roleName: normalizedRole,
        status: dto.isActive ? 'Active' : 'Inactive',
    };
}

export function toRoleId(role: AppRoleName) {
    return roleIdMap[role];
}

export const usersApi = {
    async getAll() {
        const { data } = await httpClient.get<UserDto[]>('usermanagement');
        return data.map(mapUserDtoToItem);
    },

    async create(payload: CreateUserPayload) {
        await httpClient.post('usermanagement', payload);
    },

    async edit(userId: number, payload: EditUserPayload) {
        await httpClient.put(`usermanagement/${userId}`, payload);
    },

    async changeRole(userId: number, payload: ChangeRolePayload) {
        await httpClient.put(`usermanagement/${userId}/change-role`, payload);
    },

    async toggleActive(userId: number) {
        await httpClient.patch(`usermanagement/${userId}/toggle-active`);
    },

    async resetPassword(userId: number) {
        const { data } = await httpClient.post<{ message?: string; Message?: string }>(
            `usermanagement/${userId}/reset-password`,
        );
        return data;
    },

    async isAvailable(email: string) {
        const { data } = await httpClient.get<{
            fullName?: string;
            FullName?: string;
            phone?: string;
            Phone?: string;
            email?: string;
            Email?: string;
        }>(`usermanagement/validate?email=${encodeURIComponent(email)}`);
        return {
            fullName: data.fullName ?? data.FullName ?? '',
            phone: data.phone ?? data.Phone ?? '',
            email: data.email ?? data.Email ?? email,
        };
    },
};
