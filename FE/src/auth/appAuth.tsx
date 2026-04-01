import { createContext, useMemo, useState, type PropsWithChildren } from 'react';
import { authApi } from '../api/authApi';
import { rolesApi } from '../api/rolesApi';
import { getAccessToken } from '../api/httpClient';
import { appPermissions, permissionsByRole, type AppPermission, type AppRole, type AppUser } from './auth.types';

interface AuthContextValue {
    user: AppUser | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    hasPermission: (permission: AppPermission) => boolean;
    hasAnyPermission: (permissions: AppPermission[]) => boolean;
}

const storageKeys = ['cg-admin-auth-user', 'auth-user'] as const;

export const AppAuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const payloadPart = token.split('.')[1];
        if (!payloadPart) {
            return null;
        }

        const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(normalized);
        return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function normalizeRole(rawRole: unknown): AppRole {
    const role = String(rawRole ?? '').toLowerCase();
    if (role.includes('manager')) {
        return 'Manager';
    }
    if (role.includes('staff')) {
        return 'Staff';
    }
    return 'Admin';
}

function toKnownPermissions(items: string[] | null | undefined): AppPermission[] {
    if (!items?.length) {
        return [];
    }

    const allowed = new Set(appPermissions);
    return items.filter((item): item is AppPermission => allowed.has(item as AppPermission));
}

function getInitialUser(): AppUser | null {
    for (const key of storageKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) {
            continue;
        }

        try {
            return JSON.parse(raw) as AppUser;
        } catch {
            localStorage.removeItem(key);
        }
    }

    const token = getAccessToken();
    if (!token) {
        return null;
    }

    const payload = parseJwtPayload(token);
    const roleClaim =
        payload?.role ??
        payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const role = normalizeRole(roleClaim);

    const idClaim =
        payload?.nameid ??
        payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

    const emailClaim =
        payload?.email ??
        payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];

    const nameClaim =
        payload?.name ??
        payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
        'User';

    return {
        id: Number(idClaim ?? Date.now()),
        name: String(nameClaim),
        email: String(emailClaim ?? ''),
        role,
        permissions: permissionsByRole[role],
    };
}

function persistUser(user: AppUser) {
    for (const key of storageKeys) {
        localStorage.setItem(key, JSON.stringify(user));
    }
}

function clearPersistedUser() {
    for (const key of storageKeys) {
        localStorage.removeItem(key);
    }
}

export function AppAuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<AppUser | null>(getInitialUser);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            login: async (email: string, password: string) => {
                const normalizedEmail = email.trim().toLowerCase();

                try {
                    const { token } = await authApi.login({ email: normalizedEmail, password });
                    const payload = parseJwtPayload(token);

                    const roleClaim =
                        payload?.role ??
                        payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

                    const role = normalizeRole(roleClaim);

                    const idClaim =
                        payload?.nameid ??
                        payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

                    const nameClaim =
                        payload?.name ??
                        payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
                        normalizedEmail.split('@')[0];

                    let permissions = permissionsByRole[role];
                    try {
                        const apiPermissions = await rolesApi.getMyPermissions();
                        const normalizedPermissions = toKnownPermissions(apiPermissions);
                        if (normalizedPermissions.length > 0) {
                            permissions = normalizedPermissions;
                        }
                    } catch {
                        // Keep role-based fallback permissions when my-permissions endpoint is unavailable.
                    }

                    const nextUser: AppUser = {
                        id: Number(idClaim ?? Date.now()),
                        name: String(nameClaim),
                        email: normalizedEmail,
                        role,
                        permissions,
                    };

                    setUser(nextUser);
                    persistUser(nextUser);
                    return true;
                } catch {
                    return false;
                }
            },
            logout: async () => {
                try {
                    await authApi.logout();
                } finally {
                    setUser(null);
                    clearPersistedUser();
                }
            },
            hasPermission: (permission: AppPermission) => {
                if (!user) {
                    return false;
                }
                return user.permissions.includes(permission);
            },
            hasAnyPermission: (permissions: AppPermission[]) => {
                if (!user) {
                    return false;
                }
                return permissions.some((permission) => user.permissions.includes(permission));
            },
        }),
        [user],
    );

    return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}
