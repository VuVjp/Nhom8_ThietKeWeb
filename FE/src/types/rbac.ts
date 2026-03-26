export const ROLES = ['Admin', 'Manager', 'Staff'] as const;

export const PERMISSIONS = [
    'view_dashboard',
    'view_user',
    'create_user',
    'edit_user',
    'delete_user',
    'view_role',
    'create_role',
    'edit_role',
    'delete_role',
    'assign_permissions',
] as const;

export type Role = (typeof ROLES)[number];
export type Permission = (typeof PERMISSIONS)[number];

export type AppRole = Role | string;
