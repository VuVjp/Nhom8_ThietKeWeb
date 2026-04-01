export const roleNames = [
    'Admin',
    'Manager',
    'Receptionist',
    'Accountant',
    'Housekeeping',
    'Guest',
    'Maintenance',
    'Security',
] as const;

export type RoleName = (typeof roleNames)[number];

export function toRoleName(value: string | null | undefined): RoleName | null {
    if (!value) {
        return null;
    }

    const found = roleNames.find((role) => role.toLowerCase() === value.toLowerCase());
    return found ?? null;
}
