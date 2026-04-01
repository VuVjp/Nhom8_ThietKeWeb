import type { NotificationItem } from '../types/models';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  notifications: NotificationItem[];
  unreadCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onLoadMore: () => void;
}

export function NotificationBell({ notifications, unreadCount, hasMore, isLoadingMore, onMarkRead, onMarkAllRead, onLoadMore }: NotificationBellProps) {
  return (
    <NotificationDropdown
      items={notifications}
      unreadCount={unreadCount}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onMarkRead={onMarkRead}
      onMarkAllRead={onMarkAllRead}
      onLoadMore={onLoadMore}
    />
  );
}
