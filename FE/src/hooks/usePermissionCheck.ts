import toast from 'react-hot-toast';
import type { AppPermission } from '../auth/auth.types';
import { useAppAuth } from '../auth/useAppAuth';

export function usePermissionCheck() {
    const { hasPermission } = useAppAuth();

    const ensure = (permission: AppPermission, actionLabel: string) => {
        if (hasPermission(permission)) {
            return true;
        }

        toast.error(`No permission: ${actionLabel}`);
        return false;
    };

    return { ensure };
}
