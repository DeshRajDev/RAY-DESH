import { Reel, ApiResponse } from '@/types';
import { initialReels } from '@/constants/initial-data';
import { apiClient } from './api/client';

const REELS_STORAGE_KEY = 'sanctuary_reels_v1';

class ReelsService {
  private reels: Reel[] = [];
  private listeners: ((reels: Reel[]) => void)[] = [];
  private isInitialized = false;

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(REELS_STORAGE_KEY);
        if (stored) {
          this.reels = JSON.parse(stored);
        } else {
          this.reels = [...initialReels];
          this.saveToStorage();
        }
      } catch {
        this.reels = [...initialReels];
      }
    } else {
      this.reels = [...initialReels];
    }
    this.isInitialized = true;
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(this.reels));
      } catch (err) {
        console.error('Failed to cache reels in localStorage:', err);
      }
    }
  }

  public async getReels(category?: string): Promise<ApiResponse<Reel[]>> {
    // Try to sync with backend API if available
    try {
      const response = await apiClient.get<ApiResponse<Reel[]>>('/reels', {
        params: category && category !== 'All' ? { category } : undefined,
      });

      if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
        this.reels = response.data;
        this.saveToStorage();
        this.notify();
        return response;
      }
    } catch {
      // Backend may be offline or in standalone mode, gracefully fall back to cached local storage
    }

    let filtered = [...this.reels];
    if (category === 'favorites') {
      filtered = filtered.filter((r) => r.isFavorite);
    } else if (category === 'recently_added') {
      filtered = [...filtered].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    } else if (category && category !== 'All') {
      filtered = filtered.filter((r) => r.category.toLowerCase() === category.toLowerCase());
    }

    return { success: true, data: filtered };
  }

  public async addReel(payload: {
    url: string;
    title?: string;
    caption?: string;
    category?: string;
    isFavorite?: boolean;
    platform?: 'instagram' | 'facebook';
  }): Promise<ApiResponse<Reel>> {
    const cleanUrl = payload.url.trim();

    // Check for duplicate in local cache
    const isDuplicate = this.reels.some((r) => r.url.toLowerCase() === cleanUrl.toLowerCase());
    if (isDuplicate) {
      throw new Error('This video is already in our Reels gallery!');
    }

    // Try backend API first
    try {
      const apiRes = await apiClient.post<ApiResponse<Reel>>('/reels', payload);
      if (apiRes && apiRes.success && apiRes.data) {
        this.reels.unshift(apiRes.data);
        this.saveToStorage();
        this.notify();
        return apiRes;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg.includes('already saved')) {
        throw err;
      }
      // Continue to local optimistic store if network unavailable
    }

    // Extract shortcode
    let shortcode: string | undefined;
    const isInstagram = cleanUrl.includes('instagram.com');
    const isFacebook = cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch');

    if (isInstagram) {
      const rMatch = cleanUrl.match(/\/(?:reel|reels|p)\/([a-zA-Z0-9_-]+)/i);
      if (rMatch) shortcode = rMatch[1];
    } else if (isFacebook) {
      const fbMatch = cleanUrl.match(/\/(?:videos|reel|watch)\/([0-9a-zA-Z_-]+)/i);
      if (fbMatch) shortcode = fbMatch[1];
    }

    const newReel: Reel = {
      id: `reel_${Date.now()}`,
      platform: isFacebook ? 'facebook' : 'instagram',
      url: cleanUrl,
      shortcode,
      title: payload.title || '',
      caption: payload.caption || '',
      category: payload.category || 'romantic',
      isFavorite: Boolean(payload.isFavorite),
      savedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.reels.unshift(newReel);
    this.saveToStorage();
    this.notify();

    return { success: true, data: newReel, message: 'Reel saved successfully!' };
  }

  public async updateReel(
    id: string,
    updates: Partial<Pick<Reel, 'title' | 'caption' | 'category' | 'isFavorite'>>
  ): Promise<ApiResponse<Reel>> {
    // Try API
    try {
      await apiClient.patch<ApiResponse<Reel>>(`/reels/${id}`, updates);
    } catch {
      // Graceful local update
    }

    const index = this.reels.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Reel not found');

    this.reels[index] = {
      ...this.reels[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage();
    this.notify();

    return { success: true, data: this.reels[index] };
  }

  public async toggleFavorite(id: string): Promise<ApiResponse<Reel>> {
    const item = this.reels.find((r) => r.id === id);
    if (!item) throw new Error('Reel not found');

    const nextFavState = !item.isFavorite;

    // Try API
    try {
      await apiClient.patch<ApiResponse<Reel>>(`/reels/${id}/favorite`);
    } catch {
      // Local fallback
    }

    item.isFavorite = nextFavState;
    this.saveToStorage();
    this.notify();

    return { success: true, data: { ...item } };
  }

  public async deleteReel(id: string): Promise<ApiResponse<{ id: string }>> {
    // Try API
    try {
      await apiClient.delete<ApiResponse<{ id: string }>>(`/reels/${id}`);
    } catch {
      // Local fallback
    }

    this.reels = this.reels.filter((r) => r.id !== id);
    this.saveToStorage();
    this.notify();

    return { success: true, data: { id } };
  }

  public subscribe(listener: (reels: Reel[]) => void) {
    this.listeners.push(listener);
    if (this.isInitialized) {
      listener([...this.reels]);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l([...this.reels]));
  }
}

export const reelsService = new ReelsService();
