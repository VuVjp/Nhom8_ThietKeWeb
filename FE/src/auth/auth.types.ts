export const appPermissions = [
    'VIEW_DASHBOARD',
    'MANAGE_USERS',
    'MANAGE_ROLES',
    'MANAGE_ROOMS',
    'MANAGE_BOOKINGS',
    'MANAGE_AMENITY',
    'MANAGE_SERVICES',
    'MANAGE_VOUCHERS',
    'MANAGE_INVENTORY',
    'APPROVE_LOSS',
    'UPDATE_CLEANING',
    'VIEW_REPORTS',
    'MANAGE_ATTRACTIONS',
    'MANAGE_ARTICLES',
    'MANAGE_ARTICLE_CATEGORY',
    'MANAGE_EQUIPMENTS',
    'MANAGE_ROOM_INVENTORY',
    'MANAGE_ROOM_TYPES',
    'MANAGE_CLEANING',
] as const;

export type LegacyAppPermission =
    | 'create_article'
    | 'update_article'
    | 'delete_article'
    | 'get_all_room_inventory'
    | 'create_room_inventory'
    | 'update_room_inventory'
    | 'delete_room_inventory'
    | 'get_all_rooms'
    | 'create_room'
    | 'update_room'
    | 'change_room_status'
    | 'change_room_cleaning_status'
    | 'delete_room'
    | 'manage_role'
    | 'manage_user'
    | 'manage_room_type'
    | 'manage_attraction'
    | 'create_article_category'
    | 'delete_article_category'
    | 'update_article_category'
    | 'create_amenity'
    | 'update_amenity'
    | 'delete_amenity'
    | 'update_thumbnail'
    | 'assign_role';

export type AppPermission = (typeof appPermissions)[number] | LegacyAppPermission;
export type AppRole = 'Admin' | 'Manager' | 'Receptionist' | 'Accountant' | 'Housekeeping' | 'Guest' | 'Maintenance' | 'Security';

export interface AppUser {
    id: number;
    name: string;
    email: string;
    role: AppRole | string;
    permissions: AppPermission[];
}
