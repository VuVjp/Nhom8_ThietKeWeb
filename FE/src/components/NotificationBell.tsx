import type { NotificationItem } from '../types/models';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  notifications: NotificationItem[];
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
}

export function NotificationBell({ notifications, onMarkRead, onMarkAllRead }: NotificationBellProps) {
  return (
    <NotificationDropdown items={notifications} onMarkRead={onMarkRead} onMarkAllRead={onMarkAllRead} />
  );
}
