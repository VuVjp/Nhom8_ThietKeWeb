import type { Permission, Role } from './rbac';

export interface RoleModel {
    id: string;
    name: Role;
    permissions: Permission[];
}

export interface UpsertRolePayload {
    name: Role;
    permissions: Permission[];
}
