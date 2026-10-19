import { Memory, MemoryCategory, ApiResponse } from '@/types';
import { initialMemories } from '@/constants/initial-data';
import { ApiClient } from './api/client';

const MEMORIES_STORAGE_KEY = 'sanctuary_memories_v3';

class MemoryService {
  private memories: Memory[] = [];
  private listeners: ((memories: Memory[]) => void)[] = [];

  constructor() {
    this.loadMemories();
  }

  private loadMemories(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(MEMORIES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.memories = parsed;
            return;
          }
        }
      } catch {
        // Fallback
      }
    }
    this.memories = [...initialMemories];
  }

  private saveMemories(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(this.memories));
      } catch {
        // Ignore quota errors
      }
    }
  }

  public async getMemories(category?: MemoryCategory): Promise<ApiResponse<Memory[]>> {
    try {
      if (typeof window !== 'undefined') {
        const res = await ApiClient.getInstance().get<{ success: boolean; data: any[] }>('/memories', {
          params: category && category !== 'All' ? { category } : undefined,
        });
        if (res && res.success && Array.isArray(res.data)) {
          const formatted: Memory[] = res.data.map(item => ({
            id: item.id || item._id,
            title: item.title,
            description: item.description || '',
            date: item.date,
            location: item.location || '',
            category: item.category || 'Photos',
            mediaUrls: item.mediaUrls || [],
            coverUrl: item.coverUrl || (item.mediaUrls && item.mediaUrls[0]) || '',
            tags: item.tags || [],
            isFavorite: !!item.isFavorite,
            addedById: item.addedById,
            likes: item.likes || 0,
            commentsCount: item.commentsCount || 0,
            createdAt: item.createdAt || new Date().toISOString(),
          }));
          this.memories = formatted;
          this.saveMemories();
        }
      }
    } catch {
      // Fallback to local
    }

    if (category && category !== 'All') {
      return { success: true, data: this.memories.filter(m => m.category === category) };
    }
    return { success: true, data: [...this.memories] };
  }

  public async getMemoryById(id: string): Promise<ApiResponse<Memory | null>> {
    try {
      if (typeof window !== 'undefined') {
        const res = await ApiClient.getInstance().get<{ success: boolean; data: any }>(`/memories/${id}`);
        if (res && res.success && res.data) {
          const item = res.data;
          const formatted: Memory = {
            id: item.id || item._id,
            title: item.title,
            description: item.description || '',
            date: item.date,
            location: item.location || '',
            category: item.category || 'Photos',
            mediaUrls: item.mediaUrls || [],
            coverUrl: item.coverUrl || (item.mediaUrls && item.mediaUrls[0]) || '',
            tags: item.tags || [],
            isFavorite: !!item.isFavorite,
            addedById: item.addedById,
            likes: item.likes || 0,
            commentsCount: item.commentsCount || 0,
            createdAt: item.createdAt || new Date().toISOString(),
          };
          return { success: true, data: formatted };
        }
      }
    } catch {
      // Fallback
    }

    const mem = this.memories.find(m => m.id === id) || null;
    return { success: true, data: mem };
  }

  public async createMemory(payload: Omit<Memory, 'id' | 'createdAt' | 'likes' | 'commentsCount'>): Promise<ApiResponse<Memory>> {
    let createdMemory: Memory;
    try {
      const res = await ApiClient.getInstance().post<{ success: boolean; data: any }>('/memories', payload);
      if (res && res.success && res.data) {
        const item = res.data;
        createdMemory = {
          id: item.id || item._id,
          title: item.title,
          description: item.description || '',
          date: item.date,
          location: item.location || '',
          category: item.category || 'Photos',
          mediaUrls: item.mediaUrls || [],
          coverUrl: item.coverUrl || '',
          tags: item.tags || [],
          isFavorite: !!item.isFavorite,
          addedById: item.addedById,
          likes: item.likes || 0,
          commentsCount: item.commentsCount || 0,
          createdAt: item.createdAt || new Date().toISOString(),
        };
      } else {
        throw new Error('Failed to create memory');
      }
    } catch {
      createdMemory = {
        ...payload,
        id: `mem_${Date.now()}`,
        likes: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      };
    }

    this.memories.unshift(createdMemory);
    this.saveMemories();
    this.notify();
    return { success: true, data: createdMemory };
  }

  public async toggleFavorite(id: string): Promise<ApiResponse<Memory>> {
    const mem = this.memories.find(m => m.id === id);
    if (!mem) throw new Error('Memory not found');
    mem.isFavorite = !mem.isFavorite;

    try {
      await ApiClient.getInstance().post(`/memories/${id}/favorite`);
    } catch (err) {
      console.warn('Memory favorite sync error:', err);
    }

    this.saveMemories();
    this.notify();
    return { success: true, data: { ...mem } };
  }

  public async deleteMemory(id: string): Promise<ApiResponse<boolean>> {
    this.memories = this.memories.filter(m => m.id !== id);
    try {
      await ApiClient.getInstance().delete(`/memories/${id}`);
    } catch (err) {
      console.warn('Memory delete sync error:', err);
    }

    this.saveMemories();
    this.notify();
    return { success: true, data: true };
  }

  public subscribe(listener: (memories: Memory[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.memories]));
  }
}

export const memoryService = new MemoryService();
