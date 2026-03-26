import { useMemo } from 'react';
import { useAuth } from './useAuth';
import type { Permission, Role } from '../types/rbac';

export const usePermission = () => {
    const { user } = useAuth();

    const permissionSet = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);

    const hasPermission = (permission: Permission) => permissionSet.has(permission);

    const hasAnyPermission = (permissions: Permission[]) => permissions.some((permission) => permissionSet.has(permission));

    const hasRole = (roles: Role[]) => {
        if (!user) {
            return false;
        }

        return roles.includes(user.role as Role);
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasRole,
    };
};
