import { NotificationItem, ApiResponse } from '@/types';
import { initialNotifications } from '@/constants/initial-data';

class NotificationService {
  private notifications: NotificationItem[] = [...initialNotifications];
  private listeners: ((notifications: NotificationItem[]) => void)[] = [];

  public async getNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    return { success: true, data: [...this.notifications] };
  }

  public async markAsRead(id: string): Promise<ApiResponse<NotificationItem>> {
    const notif = this.notifications.find(n => n.id === id);
    if (!notif) throw new Error('Notification not found');
    notif.isRead = true;
    this.notify();
    return { success: true, data: { ...notif } };
  }

  public async markAllAsRead(): Promise<ApiResponse<boolean>> {
    this.notifications.forEach(n => { n.isRead = true; });
    this.notify();
    return { success: true, data: true };
  }

  public async addNotification(payload: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>): Promise<ApiResponse<NotificationItem>> {
    const newNotif: NotificationItem = {
      ...payload,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    this.notifications.unshift(newNotif);
    this.notify();
    return { success: true, data: newNotif };
  }

  public subscribe(listener: (notifications: NotificationItem[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.notifications]));
  }
}

export const notificationService = new NotificationService();
