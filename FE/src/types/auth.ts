import type { AppRole, Permission } from './rbac';

export interface AuthUser {
    id: string;
    fullName: string;
    email: string;
    role: AppRole;
    permissions: Permission[];
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

export interface AuthApiResponse {
    token: string;
    refreshToken: string;
}

export interface UserProfileResponse {
    id: number;
    email?: string | null;
    fullName?: string | null;
    roleName?: string | null;
}
