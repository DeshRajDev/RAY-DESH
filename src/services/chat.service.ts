import { Message, ApiResponse } from '@/types';
import { ApiClient } from './api/client';
import { notificationService } from './notification.service';

const CHAT_STORAGE_KEY = 'sanctuary_chat_messages_v2';
const CHAT_WALLPAPER_KEY = 'sanctuary_chat_wallpaper_v2';
const CHAT_CHANNEL_NAME = 'sanctuary_chat_realtime';

export interface ChatWallpaper {
  type: 'color' | 'preset' | 'custom';
  value: string;
  opacity: number;
  blur: number;
}

export const DEFAULT_WALLPAPER: ChatWallpaper = {
  type: 'color',
  value: '#070707',
  opacity: 100,
  blur: 0,
};

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen?: string; // ISO string
}

class ChatService {
  private messages: Message[] = [];
  private listeners: ((messages: Message[]) => void)[] = [];
  private typingListeners: ((data: { userId: string; isTyping: boolean }) => void)[] = [];
  private presenceListeners: ((presence: UserPresence) => void)[] = [];
  private wallpaperListeners: ((wallpaper: ChatWallpaper) => void)[] = [];
  private channel: BroadcastChannel | null = null;
  private currentWallpaper: ChatWallpaper = DEFAULT_WALLPAPER;
  private typingTimer: NodeJS.Timeout | null = null;
  private presenceHeartbeatTimer: NodeJS.Timeout | null = null;
  private currentActiveUserId: string | null = null;

  constructor() {
    this.loadMessages();
    this.loadWallpaper();

    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHAT_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          const { type, data } = event.data || {};
          if (type === 'NEW_MESSAGE') {
            const exists = this.messages.some(m => m.id === data.id);
            if (!exists) {
              this.messages.push(data);
              this.saveMessages();
              this.notifyListeners();

              if (this.currentActiveUserId && data.receiverId === this.currentActiveUserId) {
                notificationService.addNotification({
                  type: 'message_reaction',
                  title: `New message from ${data.senderId === 'user_1' ? 'Desh' : 'Rey'}`,
                  description: data.content || 'Sent an attachment',
                  linkUrl: '/chat',
                  actionText: 'Reply in Chat',
                });
              }
            }
          } else if (type === 'UPDATE_MESSAGES') {
            this.messages = data;
            this.saveMessages();
            this.notifyListeners();
          } else if (type === 'TYPING') {
            this.typingListeners.forEach(l => l(data));
          } else if (type === 'PRESENCE') {
            this.presenceListeners.forEach(l => l(data));
          } else if (type === 'WALLPAPER') {
            this.currentWallpaper = data;
            this.wallpaperListeners.forEach(l => l(data));
          }
        };
      } catch {
        // BroadcastChannel fallback
      }

      window.addEventListener('storage', (e) => {
        if (e.key === CHAT_STORAGE_KEY && e.newValue) {
          try {
            this.messages = JSON.parse(e.newValue);
            this.notifyListeners();
          } catch {
            // ignore
          }
        } else if (e.key === CHAT_WALLPAPER_KEY && e.newValue) {
          try {
            this.currentWallpaper = JSON.parse(e.newValue);
            this.wallpaperListeners.forEach(l => l(this.currentWallpaper));
          } catch {
            // ignore
          }
        }
      });
    }
  }

  private loadMessages() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
          this.messages = JSON.parse(stored);
          return;
        }
      } catch {
        // ignore
      }
    }
    this.messages = [];
  }

  private saveMessages() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(this.messages));
      } catch {
        // ignore
      }
    }
  }

  private loadWallpaper() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CHAT_WALLPAPER_KEY);
        if (stored) {
          this.currentWallpaper = JSON.parse(stored);
          return;
        }
      } catch {
        // ignore
      }
    }
    this.currentWallpaper = DEFAULT_WALLPAPER;
  }

  public getWallpaper(): ChatWallpaper {
    return this.currentWallpaper;
  }

  public setWallpaper(wallpaper: ChatWallpaper) {
    this.currentWallpaper = wallpaper;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CHAT_WALLPAPER_KEY, JSON.stringify(wallpaper));
      } catch {
        // ignore
      }
    }
    this.wallpaperListeners.forEach(l => l(wallpaper));
    if (this.channel) {
      this.channel.postMessage({ type: 'WALLPAPER', data: wallpaper });
    }
  }

  public subscribeWallpaper(listener: (wallpaper: ChatWallpaper) => void) {
    this.wallpaperListeners.push(listener);
    listener(this.currentWallpaper);
    return () => {
      this.wallpaperListeners = this.wallpaperListeners.filter(l => l !== listener);
    };
  }

  // --- Real Heartbeat & Presence Tracking ---
  public startPresence(userId: string) {
    this.currentActiveUserId = userId;
    this.sendPresenceHeartbeat(userId, true);

    if (this.presenceHeartbeatTimer) {
      clearInterval(this.presenceHeartbeatTimer);
    }

    this.presenceHeartbeatTimer = setInterval(() => {
      this.sendPresenceHeartbeat(userId, true);
    }, 4000);

    const handleBeforeUnload = () => {
      this.sendPresenceHeartbeat(userId, false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
  }

  public stopPresence(userId: string) {
    if (this.presenceHeartbeatTimer) {
      clearInterval(this.presenceHeartbeatTimer);
      this.presenceHeartbeatTimer = null;
    }
    this.sendPresenceHeartbeat(userId, false);
  }

  private sendPresenceHeartbeat(userId: string, isOnline: boolean) {
    const presenceData: UserPresence = {
      userId,
      isOnline,
      lastSeen: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`sanctuary_presence_${userId}`, JSON.stringify(presenceData));
      } catch {
        // ignore
      }
    }

    if (this.channel) {
      this.channel.postMessage({ type: 'PRESENCE', data: presenceData });
    }
  }

  public getPartnerPresence(partnerId: string): UserPresence {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`sanctuary_presence_${partnerId}`);
        if (stored) {
          const parsed = JSON.parse(stored) as UserPresence;
          if (parsed.lastSeen) {
            const diffMs = Date.now() - new Date(parsed.lastSeen).getTime();
            // If heartbeat within last 10 seconds, user is active online
            const isReallyOnline = parsed.isOnline && diffMs < 10000;
            return {
              userId: partnerId,
              isOnline: isReallyOnline,
              lastSeen: parsed.lastSeen,
            };
          }
        }
      } catch {
        // ignore
      }
    }

    // Default offline with realistic last seen
    return {
      userId: partnerId,
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000 * 2).toISOString(),
    };
  }

  public subscribePresence(listener: (presence: UserPresence) => void) {
    this.presenceListeners.push(listener);
    return () => {
      this.presenceListeners = this.presenceListeners.filter(l => l !== listener);
    };
  }

  // --- Real Typing Status with Auto-Debounce ---
  public sendTyping(userId: string) {
    if (this.channel) {
      this.channel.postMessage({ type: 'TYPING', data: { userId, isTyping: true } });
    }

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    this.typingTimer = setTimeout(() => {
      if (this.channel) {
        this.channel.postMessage({ type: 'TYPING', data: { userId, isTyping: false } });
      }
    }, 2500);
  }

  public stopTyping(userId: string) {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    if (this.channel) {
      this.channel.postMessage({ type: 'TYPING', data: { userId, isTyping: false } });
    }
  }

  public subscribeTyping(listener: (data: { userId: string; isTyping: boolean }) => void) {
    this.typingListeners.push(listener);
    return () => {
      this.typingListeners = this.typingListeners.filter(l => l !== listener);
    };
  }

  // --- Message CRUD ---
  public async getMessages(): Promise<ApiResponse<Message[]>> {
    try {
      const res = await ApiClient.get<ApiResponse<Message[]>>('/chat/messages');
      if (res && res.success && Array.isArray(res.data)) {
        this.messages = res.data;
        this.saveMessages();
        this.notifyListeners();
        return res;
      }
    } catch {
      // Return locally cached or empty messages
    }
    return { success: true, data: [...this.messages] };
  }

  public async sendMessage(payload: {
    senderId: string;
    receiverId: string;
    content: string;
    type?: Message['type'];
    attachments?: Message['attachments'];
    replyToId?: string;
    replyToContent?: string;
    replyToSenderName?: string;
  }): Promise<ApiResponse<Message>> {
    try {
      const res = await ApiClient.post<ApiResponse<Message>>('/chat/messages', payload);
      if (res && res.success && res.data) {
        this.messages.push(res.data);
        this.saveMessages();
        this.notifyListeners();

        if (this.channel) {
          this.channel.postMessage({ type: 'NEW_MESSAGE', data: res.data });
        }
        return res;
      }
    } catch (err) {
      console.error('Failed to send message via backend', err);
    }

    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      senderId: payload.senderId,
      receiverId: payload.receiverId,
      content: payload.content,
      type: payload.type || 'text',
      attachments: payload.attachments,
      replyToId: payload.replyToId,
      replyToContent: payload.replyToContent,
      replyToSenderName: payload.replyToSenderName,
      reactions: [],
      isRead: false,
      isDelivered: true,
      createdAt: new Date().toISOString(),
    };

    this.messages.push(newMessage);
    this.saveMessages();
    this.notifyListeners();

    if (this.channel) {
      this.channel.postMessage({ type: 'NEW_MESSAGE', data: newMessage });
    }

    return { success: true, data: newMessage };
  }

  public async toggleReaction(messageId: string, emoji: string, userId: string): Promise<ApiResponse<Message>> {
    try {
      const res = await ApiClient.post<ApiResponse<Message>>(`/chat/messages/${messageId}/react`, { emoji });
      if (res && res.success && res.data) {
        const idx = this.messages.findIndex(m => m.id === messageId);
        if (idx > -1) {
          this.messages[idx] = res.data;
          this.saveMessages();
          this.notifyListeners();
          if (this.channel) {
            this.channel.postMessage({ type: 'UPDATE_MESSAGES', data: this.messages });
          }
        }
        return res;
      }
    } catch {
      // Fallback local update
    }

    const msg = this.messages.find(m => m.id === messageId);
    if (!msg) throw new Error('Message not found');

    const existingIdx = msg.reactions.findIndex(r => r.userId === userId && r.emoji === emoji);
    if (existingIdx > -1) {
      msg.reactions.splice(existingIdx, 1);
    } else {
      msg.reactions.push({ emoji, userId, timestamp: new Date().toISOString() });
    }

    this.saveMessages();
    this.notifyListeners();

    if (this.channel) {
      this.channel.postMessage({ type: 'UPDATE_MESSAGES', data: this.messages });
    }

    return { success: true, data: { ...msg } };
  }

  public async togglePin(messageId: string): Promise<ApiResponse<Message>> {
    try {
      const res = await ApiClient.post<ApiResponse<Message>>(`/chat/messages/${messageId}/pin`);
      if (res && res.success && res.data) {
        const idx = this.messages.findIndex(m => m.id === messageId);
        if (idx > -1) {
          this.messages[idx] = res.data;
          this.saveMessages();
          this.notifyListeners();
          if (this.channel) {
            this.channel.postMessage({ type: 'UPDATE_MESSAGES', data: this.messages });
          }
        }
        return res;
      }
    } catch {
      // Fallback
    }

    const msg = this.messages.find(m => m.id === messageId);
    if (!msg) throw new Error('Message not found');
    msg.isPinned = !msg.isPinned;
    this.saveMessages();
    this.notifyListeners();
    if (this.channel) {
      this.channel.postMessage({ type: 'UPDATE_MESSAGES', data: this.messages });
    }
    return { success: true, data: { ...msg } };
  }

  public async toggleFavorite(messageId: string): Promise<ApiResponse<Message>> {
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg) throw new Error('Message not found');
    msg.isFavorite = !msg.isFavorite;
    this.saveMessages();
    this.notifyListeners();
    if (this.channel) {
      this.channel.postMessage({ type: 'UPDATE_MESSAGES', data: this.messages });
    }
    return { success: true, data: { ...msg } };
  }

  public async editMessage(messageId: string, newContent: string): Promise<ApiResponse<Message>> {
    try {
      const res = await ApiClient.patch<ApiResponse<Message>>(`/chat/messages/${messageId}`, { content: newContent });
      if (res && res.success && res.data) {
        const idx = this.messages.findIndex(m => m.id === messageId);
        if (idx > -1) {
          this.messages[idx] = res.data;
          this.saveMessages();
          this.notifyListeners();
          if (this.channel) {
            this.channel.postMessage({ type: 'UPDATE_MESSAGES', data: this.messages });
          }
        }
        return res;
      }
    } catch {
      // Fallback
    }

    const msg = this.messages.find(m => m.id === messageId);
    if (!msg) throw new Error('Message not found');
    msg.content = newContent;
    msg.isEdited = true;
    msg.updatedAt = new Date().toISOString();
    this.saveMessages();
    this.notifyListeners();
    if (this.channel) {
      this.channel.postMessage({ type: 'UPDATE_MESSAGES', data: this.messages });
    }
    return { success: true, data: { ...msg } };
  }

  public async deleteMessage(messageId: string): Promise<ApiResponse<boolean>> {
    try {
      await ApiClient.delete(`/chat/messages/${messageId}`);
    } catch {
      // Continue local delete
    }

    this.messages = this.messages.filter(m => m.id !== messageId);
    this.saveMessages();
    this.notifyListeners();
    if (this.channel) {
      this.channel.postMessage({ type: 'UPDATE_MESSAGES', data: this.messages });
    }
    return { success: true, data: true };
  }

  public subscribe(listener: (messages: Message[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const copy = [...this.messages];
    this.listeners.forEach(l => l(copy));
  }
}

export const chatService = new ChatService();
