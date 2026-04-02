export const appPermissions = [
    'create_article',
    'update_article',
    'delete_article',
    'get_all_room_inventory',
    'create_room_inventory',
    'update_room_inventory',
    'delete_room_inventory',
    'get_all_rooms',
    'create_room',
    'update_room',
    'change_room_status',
    'change_room_cleaning_status',
    'delete_room',
    'manage_role',
    'manage_user',
    'manage_room_type',
    'manage_attraction',
    'create_article_category',
    'delete_article_category',
    'update_article_category',
    'create_amenity',
    'update_amenity',
    'delete_amenity',
    'update_thumbnail',
    'assign_role',
] as const;

export type AppPermission = (typeof appPermissions)[number];
export type AppRole = 'Admin' | 'Manager' | 'Staff';

export interface AppUser {
    id: number;
    name: string;
    email: string;
    role: AppRole;
    permissions: AppPermission[];
}
