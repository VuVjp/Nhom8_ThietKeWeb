import type { AppRole, Permission } from '../types/rbac';
import type { AuthApiResponse, AuthResponse, LoginRequest, UserProfileResponse } from '../types/auth';
import { apiClient, refreshClient } from './axiosClient';

const rolePermissionMap: Record<string, Permission[]> = {
    Admin: ['view_dashboard', 'view_user', 'create_user', 'edit_user', 'delete_user', 'view_role', 'create_role', 'edit_role', 'delete_role', 'assign_permissions'],
    Manager: ['view_dashboard', 'view_user', 'create_user', 'edit_user'],
    Staff: ['view_dashboard'],
};

const toAuthUser = (profile: UserProfileResponse) => {
    const role = (profile.roleName ?? 'Staff') as AppRole;

    return {
        id: String(profile.id),
        email: profile.email ?? '',
        fullName: profile.fullName ?? '',
        role,
        permissions: rolePermissionMap[profile.roleName ?? ''] ?? rolePermissionMap.Staff,
    };
};

const normalizeAuthResponse = async (payload: AuthApiResponse): Promise<AuthResponse> => {
    const profileResponse = await apiClient.get<UserProfileResponse>('/UserProfile/my-profile', {
        headers: { Authorization: `Bearer ${payload.token}` },
    });

    return {
        accessToken: payload.token,
        refreshToken: payload.refreshToken,
        user: toAuthUser(profileResponse.data),
    };
};

export const authService = {
    login: async (payload: LoginRequest) => {
        const { data } = await refreshClient.post<AuthApiResponse>('/Auth/login', payload);
        return normalizeAuthResponse(data);
    },
    refresh: async (refreshToken: string) => {
        const { data } = await refreshClient.post<AuthApiResponse>('/Auth/refresh-token', { refreshToken });
        return normalizeAuthResponse(data);
    },
    logout: async (refreshToken: string) => {
        await refreshClient.post('/Auth/logout', { refreshToken });
    },
    getProfile: async () => {
        const { data } = await apiClient.get<UserProfileResponse>('/UserProfile/my-profile');
        return toAuthUser(data);
    },
};
