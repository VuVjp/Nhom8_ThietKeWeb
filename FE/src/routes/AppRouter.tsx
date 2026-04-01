import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../layout/AdminLayout';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { RoomsPage } from '../pages/admin/RoomsPage';
import { RoomDetailPage } from '../pages/admin/RoomDetailPage';
import { InventoryPage } from '../pages/admin/InventoryPage';
import { LossPage } from '../pages/admin/LossPage';
import { CleaningPage } from '../pages/admin/CleaningPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RolesPage } from '../pages/admin/RolesPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { RequireAuth, RequirePermission } from './RouteGuards';

export const AppRouter = () => {
    return (
        <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/403" element={<ForbiddenPage />} />

            <Route element={<RequireAuth />}>
                <Route element={<AdminLayout />}>
                    <Route element={<RequirePermission permission="view_dashboard" />}>
                        <Route path="admin/dashboard" element={<DashboardPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="view_rooms" />}>
                        <Route path="admin/rooms" element={<RoomsPage />} />
                        <Route path="admin/rooms/:roomId" element={<RoomDetailPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="manage_inventory" />}>
                        <Route path="admin/inventory" element={<InventoryPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="approve_loss" />}>
                        <Route path="admin/loss" element={<LossPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="update_cleaning" />}>
                        <Route path="admin/cleaning" element={<CleaningPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="manage_users" />}>
                        <Route path="admin/users" element={<UsersPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="manage_roles" />}>
                        <Route path="admin/roles" element={<RolesPage />} />
                    </Route>
                </Route>
            </Route>

            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};
