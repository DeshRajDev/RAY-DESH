import { Memory, MemoryCategory, ApiResponse } from '@/types';
import { initialMemories } from '@/constants/initial-data';

const MEMORIES_STORAGE_KEY = 'sanctuary_memories_v2';

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
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.memories = parsed;
            return;
          }
        }
      } catch {
        // Fallback to initial memories
      }
    }
    this.memories = [...initialMemories];
  }

  private saveMemories(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(this.memories));
      } catch {
        // Ignore quota errors gracefully
      }
    }
  }

  public async getMemories(category?: MemoryCategory): Promise<ApiResponse<Memory[]>> {
    if (category && category !== 'All') {
      return { success: true, data: this.memories.filter(m => m.category === category) };
    }
    return { success: true, data: [...this.memories] };
  }

  public async getMemoryById(id: string): Promise<ApiResponse<Memory | null>> {
    const mem = this.memories.find(m => m.id === id) || null;
    return { success: true, data: mem };
  }

  public async createMemory(payload: Omit<Memory, 'id' | 'createdAt' | 'likes' | 'commentsCount'>): Promise<ApiResponse<Memory>> {
    const newMemory: Memory = {
      ...payload,
      id: `mem_${Date.now()}`,
      likes: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.memories.unshift(newMemory);
    this.saveMemories();
    this.notify();
    return { success: true, data: newMemory };
  }

  public async toggleFavorite(id: string): Promise<ApiResponse<Memory>> {
    const mem = this.memories.find(m => m.id === id);
    if (!mem) throw new Error('Memory not found');
    mem.isFavorite = !mem.isFavorite;
    this.saveMemories();
    this.notify();
    return { success: true, data: { ...mem } };
  }

  public async deleteMemory(id: string): Promise<ApiResponse<boolean>> {
    this.memories = this.memories.filter(m => m.id !== id);
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
