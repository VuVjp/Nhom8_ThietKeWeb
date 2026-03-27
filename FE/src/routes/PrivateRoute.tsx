import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import type { Permission, Role } from '../types/rbac';

interface PrivateRouteProps {
    requiredRoles?: Role[];
    requiredPermissions?: Permission[];
}

export const PrivateRoute = ({ requiredRoles, requiredPermissions }: PrivateRouteProps) => {
    const location = useLocation();
    const { isAuthenticated, isBootstrapping } = useAuth();
    const { hasRole, hasAnyPermission } = usePermission();

    if (isBootstrapping) {
        return (
            <div className="center-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace state={{ from: location }} />;
    }

    if (requiredRoles && !hasRole(requiredRoles)) {
        return <Navigate to="/403" replace />;
    }

    if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
        return <Navigate to="/403" replace />;
    }

    return <Outlet />;
};
