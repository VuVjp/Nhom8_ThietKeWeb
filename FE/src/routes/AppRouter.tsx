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
import { EquipmentPage } from '../pages/admin/EquipmentPage';
import { AmenitiesPage } from '../pages/admin/AmenitiesPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { RequireAuth, RequireAnyPermission, RequirePermission } from './RouteGuards';
import { useAppAuth } from '../auth/useAppAuth';

function AdminEntryRedirect() {
    const { user, isAuthReady } = useAppAuth();

    if (!isAuthReady) {
        return null;
    }

    const permissions = user?.permissions ?? [];
    const nextPath =
        (permissions.includes('manage_role') && '/admin/roles') ||
        (permissions.includes('manage_user') && '/admin/users') ||
        (permissions.includes('create_amenity') && '/admin/amenities') ||
        (permissions.includes('create_amenity') && '/admin/equipments') ||
        (permissions.includes('get_all_room_inventory') && '/admin/inventory') ||
        (permissions.includes('get_all_rooms') && '/admin/rooms') ||
        (permissions.includes('change_room_cleaning_status') && '/admin/cleaning') ||
        '/admin/dashboard';

    return <Navigate to={nextPath} replace />;
}

export const AppRouter = () => {
    return (
        <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/403" element={<ForbiddenPage />} />

            <Route element={<RequireAuth />}>
                <Route path="admin" element={<AdminEntryRedirect />} />
                <Route element={<AdminLayout />}>
                    <Route path="admin/dashboard" element={<DashboardPage />} />

                    <Route element={<RequireAnyPermission permissions={['get_all_rooms', 'create_room', 'update_room', 'change_room_status', 'change_room_cleaning_status', 'delete_room']} />}>
                        <Route path="admin/rooms" element={<RoomsPage />} />
                        <Route path="admin/rooms/:roomId" element={<RoomDetailPage />} />
                    </Route>

                    <Route element={<RequireAnyPermission permissions={['get_all_room_inventory', 'create_room_inventory', 'update_room_inventory', 'delete_room_inventory']} />}>
                        <Route path="admin/inventory" element={<InventoryPage />} />
                    </Route>

                    <Route path="admin/loss" element={<LossPage />} />

                    <Route element={<RequirePermission permission="change_room_cleaning_status" />}>
                        <Route path="admin/cleaning" element={<CleaningPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="manage_user" />}>
                        <Route path="admin/users" element={<UsersPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="manage_role" />}>
                        <Route path="admin/roles" element={<RolesPage />} />
                    </Route>

                    <Route element={<RequireAnyPermission permissions={['create_amenity', 'update_amenity', 'delete_amenity']} />}>
                        <Route path="admin/amenities" element={<AmenitiesPage />} />
                    </Route>

                    <Route element={<RequireAnyPermission permissions={['create_amenity', 'update_amenity', 'delete_amenity']} />}>
                        <Route path="admin/equipments" element={<EquipmentPage />} />
                    </Route>
                </Route>
            </Route>

            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};
