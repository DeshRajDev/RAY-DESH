import { Message, ApiResponse, MessageAttachment } from '@/types';
import { ApiClient } from './api/client';
import { notificationService } from './notification.service';
import { io, Socket } from 'socket.io-client';

const CHAT_STORAGE_KEY = 'sanctuary_chat_messages_v3';
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
  private typingListeners: ((data: { userId: string; isTyping: boolean; userName?: string }) => void)[] = [];
  private presenceListeners: ((presence: UserPresence) => void)[] = [];
  private wallpaperListeners: ((wallpaper: ChatWallpaper) => void)[] = [];
  private connectionListeners: ((isConnected: boolean) => void)[] = [];
  private channel: BroadcastChannel | null = null;
  private currentWallpaper: ChatWallpaper = DEFAULT_WALLPAPER;
  private typingTimer: NodeJS.Timeout | null = null;
  private currentActiveUserId: string | null = null;
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private isChatViewActive: boolean = false;
  private pendingRetries: Map<string, any> = new Map();

  constructor() {
    this.loadMessages();
    this.loadWallpaper();

    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHAT_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          const { type, data } = event.data || {};
          if (type === 'WALLPAPER') {
            this.currentWallpaper = data;
            this.wallpaperListeners.forEach((l) => l(data));
          }
        };
      } catch {
        // BroadcastChannel fallback
      }

      window.addEventListener('storage', (e) => {
        if (e.key === CHAT_WALLPAPER_KEY && e.newValue) {
          try {
            this.currentWallpaper = JSON.parse(e.newValue);
            this.wallpaperListeners.forEach((l) => l(this.currentWallpaper));
          } catch {
            // ignore
          }
        }
      });
    }
  }

  // --- Real Socket.IO Lifecycle ---
  public initSocket(userId: string) {
    if (typeof window === 'undefined') return;
    this.currentActiveUserId = userId;

    if (this.socket && this.socket.connected) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const token = ApiClient.getInstance().getToken();
    const baseOrigin = ApiClient.getBaseOrigin();

    this.socket = io(baseOrigin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.notifyConnection();

      // Check if we have un-delivered messages in our local state to acknowledge
      this.acknowledgeUndelivered();

      // Fetch latest messages from server on connect/reconnect to guarantee no dropped messages
      this.getMessages().catch(() => {});
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.notifyConnection();
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[ChatSocket] Connection error:', err.message);
      this.isConnected = false;
      this.notifyConnection();
    });

    // 1. Incoming new message
    this.socket.on('message:new', (data: any) => {
      const formatted = this.normalizeMessage(data);
      const existingIdx = this.messages.findIndex(
        (m) => m.id === formatted.id || (m as any).idempotencyKey === (formatted as any).idempotencyKey
      );

      if (existingIdx > -1) {
        this.messages[existingIdx] = formatted;
      } else {
        this.messages.push(formatted);
      }

      this.messages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      this.saveMessages();
      this.notifyListeners();

      // If message is for me, immediately acknowledge delivery (turns sender's tick into double grey ticks)
      if (this.currentActiveUserId && formatted.receiverId === this.currentActiveUserId) {
        this.markAsDelivered([formatted.id]);

        // If user is currently looking at the chat, mark as read immediately (double blue ticks)
        if (this.isChatViewActive) {
          this.markAsRead([formatted.id]);
        }

        notificationService.addNotification({
          type: 'message_reaction',
          title: `New message from ${formatted.senderId === 'user_1' ? 'Desh' : 'Rey'}`,
          description: formatted.content || 'Sent media attachment',
          linkUrl: '/chat',
          actionText: 'Reply in Chat',
        });
      }
    });

    // 2. Message delivery and read status updates
    this.socket.on('message:status', (payload: { messageIds?: string[]; status: 'delivered' | 'read'; deliveredAt?: string; readAt?: string; readerId?: string }) => {
      const { messageIds, status, deliveredAt, readAt } = payload;
      let hasChanges = false;

      this.messages = this.messages.map((m) => {
        const matches = !messageIds || messageIds.length === 0 || messageIds.includes(m.id);
        if (matches) {
          if (status === 'delivered' && m.status !== 'read') {
            hasChanges = true;
            return {
              ...m,
              isDelivered: true,
              status: 'delivered',
              deliveredAt: deliveredAt || new Date().toISOString(),
            };
          } else if (status === 'read') {
            hasChanges = true;
            return {
              ...m,
              isDelivered: true,
              isRead: true,
              status: 'read',
              readAt: readAt || new Date().toISOString(),
            };
          }
        }
        return m;
      });

      if (hasChanges) {
        this.saveMessages();
        this.notifyListeners();
      }
    });

    // 3. Partner typing status
    this.socket.on('typing:start', (data: { userId: string; userName?: string }) => {
      this.typingListeners.forEach((l) => l({ userId: data.userId, isTyping: true, userName: data.userName }));
    });

    this.socket.on('typing:stop', (data: { userId: string }) => {
      this.typingListeners.forEach((l) => l({ userId: data.userId, isTyping: false }));
    });

    // 4. Partner presence update
    this.socket.on('presence:update', (data: UserPresence) => {
      this.presenceListeners.forEach((l) => l(data));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`sanctuary_presence_${data.userId}`, JSON.stringify(data));
        } catch {
          // ignore
        }
      }
    });

    // 5. Message reaction updates
    this.socket.on('message:reaction', (data: any) => {
      const updated = this.normalizeMessage(data);
      const idx = this.messages.findIndex((m) => m.id === updated.id);
      if (idx > -1) {
        this.messages[idx].reactions = updated.reactions;
        this.saveMessages();
        this.notifyListeners();
      }
    });
  }

  public disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.notifyConnection();
    }
  }

  public setChatViewActive(isActive: boolean) {
    this.isChatViewActive = isActive;
    if (isActive && this.currentActiveUserId) {
      // Mark all unread received messages as read
      const unreadIds = this.messages
        .filter((m) => m.receiverId === this.currentActiveUserId && !m.isRead)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        this.markAsRead(unreadIds);
      }
    }
  }

  private acknowledgeUndelivered() {
    if (!this.currentActiveUserId) return;
    const undeliveredIds = this.messages
      .filter((m) => m.receiverId === this.currentActiveUserId && !m.isDelivered)
      .map((m) => m.id);

    if (undeliveredIds.length > 0) {
      this.markAsDelivered(undeliveredIds);
    }
  }

  private normalizeMessage(raw: any): Message {
    const rawAttachments = Array.isArray(raw.attachments) ? raw.attachments : [];
    const attachments: MessageAttachment[] = rawAttachments.map((att: any, i: number) => ({
      id: att.id || att._id || `att_${i}_${Date.now()}`,
      type: att.type || (att.mimeType?.startsWith('video') ? 'video' : 'image'),
      url: ApiClient.resolveAssetUrl(att.url),
      name: att.name,
      size: att.size,
      duration: att.duration,
    }));

    return {
      id: String(raw.id || raw._id),
      senderId: String(raw.senderId),
      receiverId: String(raw.receiverId),
      content: raw.content || '',
      type: raw.type || 'text',
      attachments,
      reactions: Array.isArray(raw.reactions) ? raw.reactions : [],
      replyToId: raw.replyToId ? String(raw.replyToId) : undefined,
      replyToContent: raw.replyToContent,
      replyToSenderName: raw.replyToSenderName,
      isPinned: !!raw.isPinned,
      isFavorite: !!raw.isFavorite,
      isRead: !!raw.isRead,
      isDelivered: raw.isDelivered ?? (raw.status === 'delivered' || raw.status === 'read'),
      status: raw.status || (raw.isRead ? 'read' : raw.isDelivered ? 'delivered' : 'sent'),
      deliveredAt: raw.deliveredAt,
      readAt: raw.readAt,
      isEdited: !!raw.isEdited,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt,
    };
  }

  private loadMessages() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.messages = parsed.map((m) => this.normalizeMessage(m));
            return;
          }
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
    this.wallpaperListeners.forEach((l) => l(wallpaper));
    if (this.channel) {
      this.channel.postMessage({ type: 'WALLPAPER', data: wallpaper });
    }
  }

  public subscribeWallpaper(listener: (wallpaper: ChatWallpaper) => void) {
    this.wallpaperListeners.push(listener);
    listener(this.currentWallpaper);
    return () => {
      this.wallpaperListeners = this.wallpaperListeners.filter((l) => l !== listener);
    };
  }

  // --- Real Presence Tracking ---
  public startPresence(userId: string) {
    this.currentActiveUserId = userId;
    this.initSocket(userId);
  }

  public stopPresence(_userId: string) {
    this.stopTyping(_userId);
  }

  public getPartnerPresence(partnerId: string): UserPresence {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`sanctuary_presence_${partnerId}`);
        if (stored) {
          const parsed = JSON.parse(stored) as UserPresence;
          if (parsed.lastSeen) {
            const diffMs = Date.now() - new Date(parsed.lastSeen).getTime();
            const isReallyOnline = parsed.isOnline && diffMs < 45000;
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

    return {
      userId: partnerId,
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
    };
  }

  public subscribePresence(listener: (presence: UserPresence) => void) {
    this.presenceListeners.push(listener);
    return () => {
      this.presenceListeners = this.presenceListeners.filter((l) => l !== listener);
    };
  }

  // --- Typing Indicator ---
  public sendTyping(userId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing:start');
    }

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    this.typingTimer = setTimeout(() => {
      this.stopTyping(userId);
    }, 3000);
  }

  public stopTyping(_userId: string) {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing:stop');
    }
  }

  public subscribeTyping(listener: (data: { userId: string; isTyping: boolean; userName?: string }) => void) {
    this.typingListeners.push(listener);
    return () => {
      this.typingListeners = this.typingListeners.filter((l) => l !== listener);
    };
  }

  public subscribeConnection(listener: (isConnected: boolean) => void) {
    this.connectionListeners.push(listener);
    listener(this.isConnected);
    return () => {
      this.connectionListeners = this.connectionListeners.filter((l) => l !== listener);
    };
  }

  private notifyConnection() {
    this.connectionListeners.forEach((l) => l(this.isConnected));
  }

  // --- Delivery & Read Acknowledgment ---
  public async markAsDelivered(messageIds: string[]): Promise<void> {
    if (!messageIds || messageIds.length === 0) return;

    if (this.socket && this.socket.connected) {
      this.socket.emit('message:delivered', { messageIds });
    }

    try {
      await ApiClient.post('/chat/delivered', { messageIds });
    } catch {
      // non-blocking
    }
  }

  public async markAsRead(messageIds?: string[]): Promise<void> {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message:read', { messageIds });
    }

    try {
      await ApiClient.post('/chat/read', { messageIds });
    } catch {
      // non-blocking
    }
  }

  // --- Genuine Media Upload ---
  public async uploadMedia(file: File): Promise<{
    url: string;
    type: 'image' | 'video' | 'audio';
    name: string;
    size: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await ApiClient.upload<ApiResponse<any>>('/media/upload', formData);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Media upload failed');
    }

    const data = res.data;
    const resolvedUrl = ApiClient.resolveAssetUrl(data.url);
    const mime = data.mimeType || file.type;
    const type: 'image' | 'video' | 'audio' = mime.startsWith('video')
      ? 'video'
      : mime.startsWith('audio')
      ? 'audio'
      : 'image';

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

    return {
      url: resolvedUrl,
      type,
      name: file.name,
      size: `${sizeMb} MB`,
    };
  }

  // --- Message CRUD ---
  public async getMessages(): Promise<ApiResponse<Message[]>> {
    try {
      const res = await ApiClient.get<ApiResponse<any[]>>('/chat/messages');
      if (res && res.success && Array.isArray(res.data)) {
        const normalized = res.data.map((m) => this.normalizeMessage(m));
        this.messages = normalized;
        this.saveMessages();
        this.notifyListeners();
        return { success: true, data: normalized };
      }
    } catch (err) {
      console.warn('[ChatService] Failed to load messages from backend, using cache:', err);
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
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const optimisticMessage: Message = {
      id: tempId,
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
      isDelivered: false,
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    // Store payload for retry if needed
    this.pendingRetries.set(tempId, payload);

    this.messages.push(optimisticMessage);
    this.notifyListeners();

    // 1. Try sending via Socket.IO if connected for fastest zero-latency delivery
    if (this.socket && this.socket.connected) {
      try {
        const socketResult = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Socket timeout')), 5000);
          this.socket!.emit('message:send', { ...payload, idempotencyKey }, (response: any) => {
            clearTimeout(timeout);
            if (response && response.success && response.data) {
              resolve(response.data);
            } else {
              reject(new Error(response?.error || 'Socket send failed'));
            }
          });
        });

        const persisted = this.normalizeMessage(socketResult);
        persisted.status = 'sent'; // single grey tick confirmed by server

        const idx = this.messages.findIndex((m) => m.id === tempId);
        if (idx > -1) {
          this.messages[idx] = persisted;
        } else {
          this.messages.push(persisted);
        }
        this.pendingRetries.delete(tempId);
        this.saveMessages();
        this.notifyListeners();
        return { success: true, data: persisted };
      } catch (socketErr) {
        console.warn('[ChatService] Socket send failed, falling back to HTTP:', socketErr);
      }
    }

    // 2. HTTP Fallback
    try {
      const res = await ApiClient.post<ApiResponse<any>>('/chat/messages', {
        ...payload,
        idempotencyKey,
      });

      if (res && res.success && res.data) {
        const persisted = this.normalizeMessage(res.data);
        persisted.status = 'sent'; // single grey tick confirmed

        const idx = this.messages.findIndex((m) => m.id === tempId);
        if (idx > -1) {
          this.messages[idx] = persisted;
        } else {
          this.messages.push(persisted);
        }
        this.pendingRetries.delete(tempId);
        this.saveMessages();
        this.notifyListeners();
        return { success: true, data: persisted };
      }
    } catch (httpErr) {
      console.error('[ChatService] HTTP send message failed:', httpErr);
    }

    // Mark optimistic message as failed with retry ability
    const failIdx = this.messages.findIndex((m) => m.id === tempId);
    if (failIdx > -1) {
      this.messages[failIdx].status = 'failed';
      this.notifyListeners();
    }

    return {
      success: false,
      error: { code: 'MESSAGE_SEND_FAILED', message: 'Failed to send message. Please retry.' },
      data: optimisticMessage,
    };
  }

  public async retryMessage(failedMessageId: string): Promise<ApiResponse<Message>> {
    const payload = this.pendingRetries.get(failedMessageId);
    if (!payload) {
      // Remove failed message from list
      this.messages = this.messages.filter((m) => m.id !== failedMessageId);
      this.notifyListeners();
      throw new Error('Message payload not found for retry');
    }

    // Remove the failed placeholder and resend
    this.messages = this.messages.filter((m) => m.id !== failedMessageId);
    return this.sendMessage(payload);
  }

  public async toggleReaction(messageId: string, emoji: string, userId: string): Promise<ApiResponse<Message>> {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message:reaction', { messageId, emoji });
    }

    try {
      const res = await ApiClient.post<ApiResponse<any>>(`/chat/messages/${messageId}/react`, { emoji });
      if (res && res.success && res.data) {
        const updated = this.normalizeMessage(res.data);
        const idx = this.messages.findIndex((m) => m.id === messageId);
        if (idx > -1) {
          this.messages[idx] = updated;
          this.saveMessages();
          this.notifyListeners();
        }
        return { success: true, data: updated };
      }
    } catch {
      // fallback
    }

    const msg = this.messages.find((m) => m.id === messageId);
    if (!msg) throw new Error('Message not found');

    const existingIdx = msg.reactions.findIndex((r) => r.userId === userId && r.emoji === emoji);
    if (existingIdx > -1) {
      msg.reactions.splice(existingIdx, 1);
    } else {
      msg.reactions.push({ emoji, userId, timestamp: new Date().toISOString() });
    }

    this.saveMessages();
    this.notifyListeners();
    return { success: true, data: { ...msg } };
  }

  public async togglePin(messageId: string): Promise<ApiResponse<Message>> {
    try {
      const res = await ApiClient.post<ApiResponse<any>>(`/chat/messages/${messageId}/pin`);
      if (res && res.success && res.data) {
        const updated = this.normalizeMessage(res.data);
        const idx = this.messages.findIndex((m) => m.id === messageId);
        if (idx > -1) {
          this.messages[idx] = updated;
          this.saveMessages();
          this.notifyListeners();
        }
        return { success: true, data: updated };
      }
    } catch {
      // fallback
    }

    const msg = this.messages.find((m) => m.id === messageId);
    if (!msg) throw new Error('Message not found');
    msg.isPinned = !msg.isPinned;
    this.saveMessages();
    this.notifyListeners();
    return { success: true, data: { ...msg } };
  }

  public async editMessage(messageId: string, newContent: string): Promise<ApiResponse<Message>> {
    try {
      const res = await ApiClient.patch<ApiResponse<any>>(`/chat/messages/${messageId}`, { content: newContent });
      if (res && res.success && res.data) {
        const updated = this.normalizeMessage(res.data);
        const idx = this.messages.findIndex((m) => m.id === messageId);
        if (idx > -1) {
          this.messages[idx] = updated;
          this.saveMessages();
          this.notifyListeners();
        }
        return { success: true, data: updated };
      }
    } catch {
      // fallback
    }

    const msg = this.messages.find((m) => m.id === messageId);
    if (!msg) throw new Error('Message not found');
    msg.content = newContent;
    msg.isEdited = true;
    msg.updatedAt = new Date().toISOString();
    this.saveMessages();
    this.notifyListeners();
    return { success: true, data: { ...msg } };
  }

  public async deleteMessage(messageId: string): Promise<ApiResponse<boolean>> {
    try {
      await ApiClient.delete(`/chat/messages/${messageId}`);
    } catch {
      // ignore
    }

    this.messages = this.messages.filter((m) => m.id !== messageId);
    this.saveMessages();
    this.notifyListeners();
    return { success: true, data: true };
  }

  public subscribe(listener: (messages: Message[]) => void) {
    this.listeners.push(listener);
    listener([...this.messages]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const copy = [...this.messages];
    this.listeners.forEach((l) => l(copy));
  }
}

export const chatService = new ChatService();
