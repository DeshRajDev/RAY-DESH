import { BucketListItem, BucketListCategory, ApiResponse } from '@/types';
import { initialBucketList } from '@/constants/initial-data';

const BUCKET_LIST_STORAGE_KEY = 'sanctuary_bucket_list_v2';

class BucketListService {
  private items: BucketListItem[] = [];
  private listeners: ((items: BucketListItem[]) => void)[] = [];

  constructor() {
    this.loadItems();
  }

  private loadItems(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(BUCKET_LIST_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.items = parsed;
            return;
          }
        }
      } catch {
        // Fallback to initial
      }
    }
    this.items = [...initialBucketList];
  }

  private saveItems(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(BUCKET_LIST_STORAGE_KEY, JSON.stringify(this.items));
      } catch {
        // Ignore quota errors
      }
    }
  }

  public async getItems(category?: BucketListCategory): Promise<ApiResponse<BucketListItem[]>> {
    if (category) {
      return { success: true, data: this.items.filter(i => i.category === category) };
    }
    return { success: true, data: [...this.items] };
  }

  public async addItem(payload: Omit<BucketListItem, 'id' | 'dateAdded' | 'isCompleted'>): Promise<ApiResponse<BucketListItem>> {
    const newItem: BucketListItem = {
      ...payload,
      id: `bkt_${Date.now()}`,
      isCompleted: false,
      dateAdded: new Date().toISOString(),
    };
    this.items.unshift(newItem);
    this.saveItems();
    this.notify();
    return { success: true, data: newItem };
  }

  public async toggleComplete(id: string): Promise<ApiResponse<BucketListItem>> {
    const item = this.items.find(i => i.id === id);
    if (!item) throw new Error('Bucket list item not found');
    item.isCompleted = !item.isCompleted;
    item.completedDate = item.isCompleted ? new Date().toISOString() : undefined;
    this.saveItems();
    this.notify();
    return { success: true, data: { ...item } };
  }

  public async deleteItem(id: string): Promise<ApiResponse<boolean>> {
    this.items = this.items.filter(i => i.id !== id);
    this.saveItems();
    this.notify();
    return { success: true, data: true };
  }

  public subscribe(listener: (items: BucketListItem[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.items]));
  }
}

export const bucketListService = new BucketListService();
