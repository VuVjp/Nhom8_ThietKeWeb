import { createContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authApi } from '../api/authApi';
import { rolesApi } from '../api/rolesApi';
import { getAccessToken } from '../api/httpClient';
import { appPermissions, type AppPermission, type AppRole, type AppUser } from './auth.types';
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

const legacyPermissionMap: Record<string, AppPermission[]> = {
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

function toKnownPermissions(items: string[] | null | undefined): AppPermission[] {
    if (!items?.length) {
        return [];
    }

    const allowed = new Set(appPermissions);
    const normalized = new Set<AppPermission>();

    for (const item of items) {
        const trimmed = item.trim();
        if (!trimmed) {
            continue;
        }

        if (allowed.has(trimmed as AppPermission)) {
            normalized.add(trimmed as AppPermission);
            continue;
        }

        const mapped = legacyPermissionMap[trimmed.toUpperCase()];
        if (mapped) {
            mapped.forEach((permission) => normalized.add(permission));
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
    };
}

async function resolveCurrentUser(emailOverride?: string): Promise<AppUser | null> {
    const baseUser = getUserBaseFromToken();
    if (!baseUser) {
        return null;
    }

    try {
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
                if (user.role === 'Admin') {
                    return true;
                }
                return user.permissions.includes(permission);
            },
            hasAnyPermission: (permissions: AppPermission[]) => {
                if (!user) {
                    return false;
                }
                if (user.role === 'Admin') {
                    return true;
                }
                return permissions.some((permission) => user.permissions.includes(permission));
            },
        }),
        [user, isAuthReady],
    );

    return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}
