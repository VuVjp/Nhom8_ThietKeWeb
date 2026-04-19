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
import { MembershipsPage } from '../pages/admin/MembershipsPage';
import { AttractionsPage } from '../pages/admin/AttractionsPage';
import { AuditLogPage } from '../pages/admin/AuditLogPage';
import { ReviewsPage } from '../pages/admin/ReviewsPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { InvoicesPage } from '../pages/admin/InvoicesPage';
import { InvoiceDetailPage } from '../pages/admin/InvoiceDetailPage';
import { CreateBookingPage } from '../pages/admin/reception/CreateBookingPage';
import { ArrivalsPage } from '../pages/admin/reception/ArrivalsPage';
import { InHousePage } from '../pages/admin/reception/InHousePage';
import { BookingsListPage } from '../pages/admin/reception/BookingsListPage';
import { ServiceCategoriesPage } from '../pages/admin/ServiceCategoriesPage';
import { ServicesPage } from '../pages/admin/ServicesPage';
import { OrderServicesListPage } from '../pages/admin/reception/OrderServicesListPage';
import { OrderServiceDetailPage } from '../pages/admin/reception/OrderServiceDetailPage';
import { AddServiceToOrderPage } from '../pages/admin/reception/AddServiceToOrderPage';
import { RequireAuth, RequireAnyPermission, RequirePermission } from './RouteGuards';
import { useAppAuth } from '../auth/useAppAuth';
import { ArticlesPage } from '../modules/article/pages/ArticlesPage';
import { ArticleFormPage } from '../modules/article/pages/ArticleFormPage';
import { ArticleCategoriesPage } from '../modules/article/pages/ArticleCategoriesPage';

import { ClientLayout } from '../layout/ClientLayout';
import { HomePage } from '../pages/client/HomePage';
import { ClientRoomsPage } from '../pages/client/ClientRoomsPage';
import { ClientAttractionsPage } from '../pages/client/ClientAttractionsPage';
import { ClientMembershipsPage } from '../pages/client/ClientMembershipsPage';
import { ClientRoomDetailPage } from '../pages/client/ClientRoomDetailPage';
import { ClientBookingPage } from '../pages/client/ClientBookingPage';
import { ClientLoginPage } from '../pages/client/ClientLoginPage';
import { ClientRegisterPage } from '../pages/client/ClientRegisterPage';
import { ClientAccountPage } from '../pages/client/ClientAccountPage';
import { ClientServicesPage } from '../pages/client/ClientServicesPage';
import { ClientNewsPage } from '../pages/client/ClientNewsPage';
import { ClientAboutPage } from '../pages/client/ClientAboutPage';

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

                    <Route path="admin/memberships" element={<MembershipsPage />} />
                    <Route path="admin/attractions" element={<AttractionsPage />} />

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

                    <Route element={<RequirePermission permission="VIEW_DASHBOARD" />}>
                        <Route path="admin/audit-log" element={<AuditLogPage />} />
                    </Route>

                    <Route element={<RequirePermission permission="MANAGE_REVIEWS" />}>
                        <Route path="admin/reviews" element={<ReviewsPage />} />
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

                    {/* Service Module */}
                    <Route element={<RequireAnyPermission permissions={['MANAGE_SERVICES']} />}>
                        <Route path="admin/service-categories" element={<ServiceCategoriesPage />} />
                        <Route path="admin/services" element={<ServicesPage />} />
                        <Route path="admin/reception/order-services" element={<OrderServicesListPage />} />
                        <Route path="admin/reception/order-services/:id" element={<OrderServiceDetailPage />} />
                        <Route path="admin/reception/order-services/:id/add-service" element={<AddServiceToOrderPage />} />
                    </Route>
                    <Route element={<RequireAnyPermission permissions={['MANAGE_BOOKINGS']} />}>
                        <Route path="admin/invoices" element={<InvoicesPage />} />
                        <Route path="admin/invoices/:id" element={<InvoiceDetailPage />} />
                    </Route>
                </Route>
            </Route>

            <Route element={<ClientLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/rooms" element={<ClientRoomsPage />} />
                <Route path="/rooms/:roomId" element={<ClientRoomDetailPage />} />
                <Route path="/booking" element={<ClientBookingPage />} />
                <Route path="/login" element={<ClientLoginPage />} />
                <Route path="/register" element={<ClientRegisterPage />} />
                <Route path="/account" element={<ClientAccountPage />} />
                <Route path="/services" element={<ClientServicesPage />} />
                <Route path="/news" element={<ClientNewsPage />} />
                <Route path="/about" element={<ClientAboutPage />} />

                <Route path="/attractions" element={<ClientAttractionsPage />} />
                <Route path="/memberships" element={<ClientMembershipsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};
