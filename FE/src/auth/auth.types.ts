export const appPermissions = [
    'view_dashboard',
    'view_rooms',
    'manage_rooms',
    'manage_inventory',
    'update_cleaning',
    'approve_loss',
    'manage_users',
    'manage_roles',
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

export const permissionsByRole: Record<AppRole, AppPermission[]> = {
    Admin: [...appPermissions],
    Manager: ['view_dashboard', 'view_rooms', 'manage_rooms', 'manage_inventory', 'update_cleaning', 'approve_loss'],
    Staff: ['view_dashboard', 'view_rooms', 'update_cleaning'],
};
