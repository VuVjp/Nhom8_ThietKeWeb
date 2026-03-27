import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RolesPage } from '../pages/RolesPage';
import { UsersPage } from '../pages/UsersPage';
import { PrivateRoute } from './PrivateRoute';

export const AppRouter = () => {
    return (
        <Routes>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/403" element={<ForbiddenPage />} />

            <Route element={<PrivateRoute requiredPermissions={['view_dashboard']} />}>
                <Route element={<AdminLayout />}>
                    <Route element={<PrivateRoute requiredRoles={['Admin', 'Manager']} />} >
                        <Route path="/admin/dashboard" element={<DashboardPage />} />
                    </Route>

                    <Route element={<PrivateRoute requiredPermissions={['view_user']} requiredRoles={['Admin', 'Manager']} />}>
                        <Route path="/admin/users" element={<UsersPage />} />
                    </Route>

                    <Route element={<PrivateRoute requiredPermissions={['view_role']} requiredRoles={['Admin']} />}>
                        <Route path="/admin/roles" element={<RolesPage />} />
                    </Route>
                </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
