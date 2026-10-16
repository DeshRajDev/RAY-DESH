import { Memory, MemoryCategory, ApiResponse } from '@/types';
import { initialMemories } from '@/constants/initial-data';

class MemoryService {
  private memories: Memory[] = [...initialMemories];
  private listeners: ((memories: Memory[]) => void)[] = [];

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
    this.notify();
    return { success: true, data: newMemory };
  }

  public async toggleFavorite(id: string): Promise<ApiResponse<Memory>> {
    const mem = this.memories.find(m => m.id === id);
    if (!mem) throw new Error('Memory not found');
    mem.isFavorite = !mem.isFavorite;
    this.notify();
    return { success: true, data: { ...mem } };
  }

  public async deleteMemory(id: string): Promise<ApiResponse<boolean>> {
    this.memories = this.memories.filter(m => m.id !== id);
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
