import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

export const appPermissions = [
    'view_dashboard',
    'view_rooms',
    'manage_rooms',
    'manage_inventory',
    'update_cleaning',
    'approve_loss',
    'manage_users',
    'manage_roles',
] as const;

export type AppPermission = (typeof appPermissions)[number];
export type AppRole = 'Admin' | 'Manager' | 'Staff';

export interface AppUser {
    id: number;
    name: string;
    email: string;
    role: AppRole;
    permissions: AppPermission[];
}

interface AuthContextValue {
    user: AppUser | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => boolean;
    logout: () => void;
    hasPermission: (permission: AppPermission) => boolean;
    hasAnyPermission: (permissions: AppPermission[]) => boolean;
}

interface MockAccount {
    email: string;
    password: string;
    user: AppUser;
}

const storageKey = 'cg-admin-auth-user';

const permissionsByRole: Record<AppRole, AppPermission[]> = {
    Admin: [...appPermissions],
    Manager: ['view_dashboard', 'view_rooms', 'manage_rooms', 'manage_inventory', 'update_cleaning', 'approve_loss'],
    Staff: ['view_dashboard', 'view_rooms', 'update_cleaning'],
};

const mockAccounts: MockAccount[] = [
    {
        email: 'admin@hotel-admin.com',
        password: 'admin123',
        user: {
            id: 1,
            name: 'Admin User',
            email: 'admin@hotel-admin.com',
            role: 'Admin',
            permissions: permissionsByRole.Admin,
        },
    },
    {
        email: 'manager@hotel-admin.com',
        password: 'manager123',
        user: {
            id: 2,
            name: 'Manager User',
            email: 'manager@hotel-admin.com',
            role: 'Manager',
            permissions: permissionsByRole.Manager,
        },
    },
    {
        email: 'staff@hotel-admin.com',
        password: 'staff123',
        user: {
            id: 3,
            name: 'Staff User',
            email: 'staff@hotel-admin.com',
            role: 'Staff',
            permissions: permissionsByRole.Staff,
        },
    },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getInitialUser(): AppUser | null {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as AppUser;
    } catch {
        localStorage.removeItem(storageKey);
        return null;
    }
}

export function AppAuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<AppUser | null>(getInitialUser);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            login: (email: string, password: string) => {
                const account = mockAccounts.find(
                    (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
                );

                if (!account) {
                    return false;
                }

                setUser(account.user);
                localStorage.setItem(storageKey, JSON.stringify(account.user));
                return true;
            },
            logout: () => {
                setUser(null);
                localStorage.removeItem(storageKey);
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

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAppAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAppAuth must be used within AppAuthProvider');
    }
    return context;
}

export const mockLoginAccounts = mockAccounts.map((item) => ({
    email: item.email,
    password: item.password,
    role: item.user.role,
}));
