import { BucketListItem, BucketListCategory, ApiResponse } from '@/types';
import { initialBucketList } from '@/constants/initial-data';
import { ApiClient } from './api/client';

const BUCKET_LIST_STORAGE_KEY = 'sanctuary_bucket_list_v3';

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
          if (Array.isArray(parsed)) {
            this.items = parsed;
            return;
          }
        }
      } catch {
        // Fallback
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
    try {
      if (typeof window !== 'undefined') {
        const res = await ApiClient.getInstance().get<{ success: boolean; data: any[] }>('/bucket-list');
        if (res && res.success && Array.isArray(res.data)) {
          const formatted: BucketListItem[] = res.data.map(item => ({
            id: item.id || item._id,
            title: item.title,
            description: item.description,
            category: item.category || 'Travel',
            priority: item.priority || 'medium',
            isCompleted: !!item.isCompleted,
            dateAdded: item.dateAdded || item.createdAt || new Date().toISOString(),
            completedDate: item.completedDate,
            location: item.location,
            photos: item.photos,
            notes: item.notes,
            addedById: item.addedById,
          }));
          this.items = formatted;
          this.saveItems();
        }
      }
    } catch {
      // Fallback
    }

    if (category) {
      return { success: true, data: this.items.filter(i => i.category === category) };
    }
    return { success: true, data: [...this.items] };
  }

  public async addItem(payload: Omit<BucketListItem, 'id' | 'dateAdded' | 'isCompleted'>): Promise<ApiResponse<BucketListItem>> {
    let newItem: BucketListItem;
    try {
      const res = await ApiClient.getInstance().post<{ success: boolean; data: any }>('/bucket-list', payload);
      if (res && res.success && res.data) {
        const item = res.data;
        newItem = {
          id: item.id || item._id,
          title: item.title,
          description: item.description,
          category: item.category,
          priority: item.priority,
          isCompleted: false,
          dateAdded: item.dateAdded || item.createdAt || new Date().toISOString(),
          location: item.location,
          addedById: item.addedById,
        };
      } else {
        throw new Error('Failed to create bucket item');
      }
    } catch {
      newItem = {
        ...payload,
        id: `bkt_${Date.now()}`,
        isCompleted: false,
        dateAdded: new Date().toISOString(),
      };
    }

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

    try {
      await ApiClient.getInstance().post(`/bucket-list/${id}/toggle`);
    } catch (err) {
      console.warn('Bucket list toggle sync error:', err);
    }

    this.saveItems();
    this.notify();
    return { success: true, data: { ...item } };
  }

  public async deleteItem(id: string): Promise<ApiResponse<boolean>> {
    this.items = this.items.filter(i => i.id !== id);
    try {
      await ApiClient.getInstance().delete(`/bucket-list/${id}`);
    } catch (err) {
      console.warn('Bucket list delete sync error:', err);
    }

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
