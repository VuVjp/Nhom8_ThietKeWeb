import { createContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authApi } from '../api/authApi';
import { rolesApi } from '../api/rolesApi';
import { getAccessToken } from '../api/httpClient';
import { appPermissions, type AppPermission, type AppUser } from './auth.types';
import { subscribeAuthRefresh } from '../api/httpClient';

const PERMISSIONS_STORAGE_KEY = 'permissions';

interface AuthContextValue {
    user: AppUser | null;
    isAuthenticated: boolean;
    isAuthReady: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    hasPermission: (permission: AppPermission) => boolean;
    hasAnyPermission: (permissions: AppPermission[]) => boolean;
}

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

function toKnownPermissions(items: string[] | null | undefined): AppPermission[] {
    if (!items?.length) {
        return [];
    }

    const allowed = new Set<string>(appPermissions);
    const normalized = new Set<AppPermission>();

    for (const item of items) {
        const trimmed = item.trim();
        if (!trimmed) {
            continue;
        }

        const canonical = trimmed.toUpperCase() as AppPermission;
        if (allowed.has(canonical)) {
            normalized.add(canonical);
            continue;
        }
    }

    return Array.from(normalized);
}

function getUserBaseFromToken(): Omit<AppUser, 'permissions'> | null {
    const token = getAccessToken();
    if (!token) {
        return null;
    }

    const payload = parseJwtPayload(token);
    const roleClaim =
        payload?.role ??
        payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

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
    };
}

async function resolveCurrentUser(emailOverride?: string): Promise<AppUser | null> {
    const baseUser = getUserBaseFromToken();
    if (!baseUser) {
        return null;
    }

    try {
        // This is a fallback in case the permissions are not in localStorage for some reason (e.g. cleared, or user logged in from another tab)

        // const permissions = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
        // if (permissions) {
        //     const parsed = JSON.parse(permissions) as string[];
        //     const normalized = toKnownPermissions(parsed);
        //     return {
        //         ...baseUser,
        //         email: emailOverride?.trim().toLowerCase() || baseUser.email,
        //         permissions: normalized,
        //     };
        // }
        const apiPermissions = await rolesApi.getMyPermissions();
        const normalizedPermissions = toKnownPermissions(apiPermissions);
        localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(normalizedPermissions));

        return {
            ...baseUser,
            email: emailOverride?.trim().toLowerCase() || baseUser.email,
            permissions: normalizedPermissions,
        };
    } catch {
        return null;
    }
}

export function AppAuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        let active = true;

        void resolveCurrentUser().then((nextUser) => {
            if (active) {
                setUser(nextUser);
                setIsAuthReady(true);
            }
        });

        const unsubscribe = subscribeAuthRefresh(() => {
            void resolveCurrentUser().then((nextUser) => {
                if (active) {
                    setUser(nextUser);
                }
            });
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            isAuthReady,
            login: async (email: string, password: string) => {
                const normalizedEmail = email.trim().toLowerCase();

                try {
                    await authApi.login({ email: normalizedEmail, password });

                    const nextUser = await resolveCurrentUser(normalizedEmail);

                    if (!nextUser) {
                        return false;
                    }

                    setUser(nextUser);
                    setIsAuthReady(true);
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
                    localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
                    setIsAuthReady(true);
                }
            },
            hasPermission: (permission: AppPermission) => {
                if (!user) {
                    return false;
                }
                return user.permissions.includes(permission.toUpperCase() as AppPermission);
            },
            hasAnyPermission: (permissions: AppPermission[]) => {
                if (!user) {
                    return false;
                }
                return permissions.some((permission) => user.permissions.includes(permission.toUpperCase() as AppPermission));
            },
        }),
        [user, isAuthReady],
    );

    return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}
