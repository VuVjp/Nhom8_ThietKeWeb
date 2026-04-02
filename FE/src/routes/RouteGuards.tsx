import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { AppPermission } from '../auth/auth.types';
import { useAppAuth } from '../auth/useAppAuth';

interface RequirePermissionProps {
    permission: AppPermission;
}

interface RequireAnyPermissionProps {
    permissions: AppPermission[];
}

export function RequireAuth() {
    const { isAuthenticated, isAuthReady } = useAppAuth();
    const location = useLocation();

    if (!isAuthReady) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}

export function RequirePermission({ permission }: RequirePermissionProps) {
    const { hasPermission, isAuthReady } = useAppAuth();

    if (!isAuthReady) {
        return null;
    }

    if (!hasPermission(permission)) {
        return <Navigate to="/403" replace />;
    }

    return <Outlet />;
}

export function RequireAnyPermission({ permissions }: RequireAnyPermissionProps) {
    const { hasAnyPermission, isAuthReady } = useAppAuth();

    if (!isAuthReady) {
        return null;
    }

    if (!hasAnyPermission(permissions)) {
        return <Navigate to="/403" replace />;
    }

    return <Outlet />;
}
