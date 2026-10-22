import { NotificationItem, ApiResponse } from '@/types';
import { ApiClient } from './api/client';

const NOTIFICATIONS_STORAGE_KEY = 'sanctuary_notifications_v2';

class NotificationService {
  private notifications: NotificationItem[] = [];
  private listeners: ((notifications: NotificationItem[]) => void)[] = [];

  constructor() {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.notifications = parsed;
            return;
          }
        }
      } catch {
        // Fallback
      }
    }
    this.notifications = [];
  }

  private saveNotifications(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
      } catch {
        // Ignore quota error
      }
    }
  }

  public isPushSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Register Web Push subscription automatically
        await this.subscribeToWebPush();
      }
      return permission;
    } catch {
      return 'default';
    }
  }

  public async subscribeToWebPush(): Promise<boolean> {
    if (!this.isPushSupported()) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      if (!reg || !reg.pushManager) return false;

      // 1. Fetch backend VAPID public key (prefer backend endpoint, fallback to env)
      let vapidPublicKey: string | null = null;
      try {
        const keyRes = await ApiClient.get<{ success: boolean; data: { publicKey: string } }>('/notifications/vapid-public-key');
        if (keyRes && keyRes.success && keyRes.data?.publicKey) {
          vapidPublicKey = keyRes.data.publicKey;
        }
      } catch (err) {
        console.warn('[NotificationService] Failed to retrieve VAPID key from backend:', err);
      }

      if (!vapidPublicKey && typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      }

      if (!vapidPublicKey) {
        console.warn('[NotificationService] VAPID public key unavailable on server and client. Push subscription deferred.');
        return false;
      }

      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // 2. Check for existing subscription or create new one
      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as unknown as BufferSource,
        });
      }

      // 3. Send subscription to backend to persist with authenticated user
      await ApiClient.post('/notifications/push-subscription', subscription.toJSON());
      return true;
    } catch (err) {
      console.warn('[NotificationService] Web Push subscription error:', err);
      return false;
    }
  }

  public async unsubscribeFromWebPush(): Promise<boolean> {
    if (!this.isPushSupported()) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.pushManager) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await ApiClient.delete('/notifications/push-subscription', {
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  public async getNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    try {
      const res = await ApiClient.get<ApiResponse<NotificationItem[]>>('/notifications');
      if (res && res.success && Array.isArray(res.data)) {
        this.notifications = res.data;
        this.saveNotifications();
        this.notify();
        return res;
      }
    } catch {
      // Fallback
    }
    return { success: true, data: [...this.notifications] };
  }

  public async markAsRead(id: string): Promise<ApiResponse<NotificationItem>> {
    try {
      const res = await ApiClient.post<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
      if (res && res.success && res.data) {
        const idx = this.notifications.findIndex(n => n.id === id);
        if (idx > -1) {
          this.notifications[idx] = res.data;
          this.saveNotifications();
          this.notify();
        }
        return res;
      }
    } catch {
      // Fallback
    }

    const notif = this.notifications.find(n => n.id === id);
    if (!notif) throw new Error('Notification not found');
    notif.isRead = true;
    this.saveNotifications();
    this.notify();
    return { success: true, data: { ...notif } };
  }

  public async markAllAsRead(): Promise<ApiResponse<boolean>> {
    try {
      await ApiClient.post('/notifications/mark-all-read');
    } catch {
      // Fallback
    }

    this.notifications.forEach(n => { n.isRead = true; });
    this.saveNotifications();
    this.notify();
    return { success: true, data: true };
  }

  public async addNotification(payload: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>): Promise<ApiResponse<NotificationItem>> {
    // Prevent immediate duplicate notifications within the last 5 minutes
    const isDuplicate = this.notifications.some(n => 
      n.title === payload.title &&
      n.description === payload.description &&
      (Date.now() - new Date(n.timestamp).getTime()) < 5 * 60 * 1000
    );

    if (isDuplicate) {
      const existing = this.notifications.find(n => n.title === payload.title)!;
      return { success: true, data: existing };
    }

    const newNotif: NotificationItem = {
      ...payload,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    this.notifications.unshift(newNotif);
    this.saveNotifications();
    this.notify();

    // Trigger browser notification if supported and permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(payload.title, {
          body: payload.description,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: newNotif.id,
        });
      } catch {
        // Notification API fallback
      }
    }

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
