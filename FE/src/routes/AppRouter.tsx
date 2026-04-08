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
import { RoomTypesPage } from '../pages/admin/RoomTypesPage';
import { VouchersPage } from '../pages/admin/VouchersPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { CreateBookingPage } from '../pages/admin/reception/CreateBookingPage';
import { ArrivalsPage } from '../pages/admin/reception/ArrivalsPage';
import { InHousePage } from '../pages/admin/reception/InHousePage';
import { BookingsListPage } from '../pages/admin/reception/BookingsListPage';
import { RequireAuth, RequireAnyPermission, RequirePermission } from './RouteGuards';
import { useAppAuth } from '../auth/useAppAuth';
import { ArticlesPage } from '../modules/article/pages/ArticlesPage';
import { ArticleFormPage } from '../modules/article/pages/ArticleFormPage';
import { ArticleCategoriesPage } from '../modules/article/pages/ArticleCategoriesPage';

function AdminEntryRedirect() {
    const { user, isAuthReady } = useAppAuth();

    if (!isAuthReady) {
        return null;
    }

    const permissions = user?.permissions ?? [];
    const nextPath =
        (permissions.includes('VIEW_DASHBOARD') && '/admin/dashboard') ||
        (permissions.includes('MANAGE_ROLES') && '/admin/roles') ||
        (permissions.includes('MANAGE_USERS') && '/admin/users') ||
        (permissions.includes('MANAGE_ROOM_TYPES') && '/admin/room-types') ||
        (permissions.includes('MANAGE_AMENITY') && '/admin/amenities') ||
        (permissions.includes('MANAGE_EQUIPMENTS') && '/admin/equipments') ||
        (permissions.includes('MANAGE_ROOM_INVENTORY') && '/admin/inventory') ||
        (permissions.includes('MANAGE_ROOMS') && '/admin/rooms') ||
        (permissions.includes('UPDATE_CLEANING') && '/admin/cleaning') ||
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
                    <Route element={<RequireAnyPermission permissions={['VIEW_DASHBOARD']} />}>
                        <Route path="admin/dashboard" element={<DashboardPage />} />
                    </Route>

                    <Route element={<RequireAnyPermission permissions={['MANAGE_ROOMS']} />}>
                        <Route path="admin/rooms" element={<RoomsPage />} />
                        <Route path="admin/rooms/:roomId" element={<RoomDetailPage />} />
                    </Route>

                    <Route element={<RequireAnyPermission permissions={['MANAGE_INVENTORY']} />}>
                        <Route path="admin/inventory" element={<InventoryPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="APPROVE_LOSS" />}>
                        <Route path="admin/loss" element={<LossPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="UPDATE_CLEANING" />}>
                        <Route path="admin/cleaning" element={<CleaningPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="MANAGE_USERS" />}>
                        <Route path="admin/users" element={<UsersPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="MANAGE_ROLES" />}>
                        <Route path="admin/roles" element={<RolesPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="MANAGE_ROOM_TYPES" />}>
                        <Route path="admin/room-types" element={<RoomTypesPage />} />
                    </Route>

                    <Route element={<RequireAnyPermission permissions={['MANAGE_AMENITY']} />}>
                        <Route path="admin/amenities" element={<AmenitiesPage />} />
                    </Route>

                    <Route element={<RequireAnyPermission permissions={['MANAGE_EQUIPMENTS']} />}>
                        <Route path="admin/equipments" element={<EquipmentPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="MANAGE_VOUCHERS" />}>
                        <Route path="admin/vouchers" element={<VouchersPage />} />
                    </Route>

                    <Route element={<RequireAnyPermission permissions={['MANAGE_BOOKINGS']} />}>
                        <Route path="admin/reception/create-booking" element={<CreateBookingPage />} />
                        <Route path="admin/reception/arrivals" element={<ArrivalsPage />} />
                        <Route path="admin/reception/in-house" element={<InHousePage />} />
                        <Route path="admin/reception/bookings" element={<BookingsListPage />} />
                    </Route>

                    <Route element={<RequireAnyPermission permissions={['MANAGE_ARTICLES']} />}>
                        <Route path="admin/articles" element={<ArticlesPage />} />
                        <Route path="admin/articles/new" element={<ArticleFormPage />} />
                        <Route path="admin/articles/:id/edit" element={<ArticleFormPage />} />
                    </Route>

                    <Route element={<RequireAnyPermission permissions={['MANAGE_ARTICLE_CATEGORY']} />}>
                        <Route path="admin/article-categories" element={<ArticleCategoriesPage />} />
                    </Route>
                </Route>
            </Route>

            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};
