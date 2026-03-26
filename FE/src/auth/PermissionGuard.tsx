import type { PropsWithChildren, ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';
import type { Permission } from '../types/rbac';

interface PermissionGuardProps extends PropsWithChildren {
    permissions: Permission | Permission[];
    requireAll?: boolean;
    fallback?: ReactNode;
}

export const PermissionGuard = ({
    children,
    permissions,
    requireAll = false,
    fallback = null,
}: PermissionGuardProps) => {
    const { hasPermission, hasAnyPermission } = usePermission();

    const list = Array.isArray(permissions) ? permissions : [permissions];

    const isAllowed = requireAll ? list.every((permission) => hasPermission(permission)) : hasAnyPermission(list);

    if (!isAllowed) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
