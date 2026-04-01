import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { AppPermission } from '../auth/appAuth';
import { useAppAuth } from '../auth/appAuth';

interface RequirePermissionProps {
    permission: AppPermission;
}

export function RequireAuth() {
    const { isAuthenticated } = useAppAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}

export function RequirePermission({ permission }: RequirePermissionProps) {
    const { hasPermission } = useAppAuth();

    if (!hasPermission(permission)) {
        return <Navigate to="/403" replace />;
    }

    return <Outlet />;
}
