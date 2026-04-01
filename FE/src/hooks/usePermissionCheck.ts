import toast from 'react-hot-toast';
import type { AppPermission } from '../auth/appAuth';
import { useAppAuth } from '../auth/appAuth';

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
