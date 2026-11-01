import { MediaAsset, ApiResponse, MediaSectionCategory } from '@/types';
import { ApiClient, API_BASE_URL } from './api/client';
import { authService } from './auth.service';

const MEDIA_CACHE_KEY = 'sanctuary_media_assets_v1';

export interface MediaFilterParams {
  category?: string;
  mediaType?: 'all' | 'image' | 'video';
  favorite?: boolean;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UploadProgressInfo {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  asset?: MediaAsset;
  abortController?: AbortController;
}

class MediaService {
  private assets: MediaAsset[] = [];
  private listeners: ((assets: MediaAsset[]) => void)[] = [];

  constructor() {
    this.loadCachedData();
  }

  private loadCachedData() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(MEDIA_CACHE_KEY);
        if (stored) {
          this.assets = JSON.parse(stored);
        }
      } catch {
        // ignore
      }
    }
  }

  private saveToCache() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MEDIA_CACHE_KEY, JSON.stringify(this.assets.slice(0, 100)));
      } catch {
        // ignore quota limits
      }
    }
  }

  public subscribe(listener: (assets: MediaAsset[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.assets));
  }

  /**
   * Upload single file with genuine progress tracking via XMLHttpRequest
   */
  public uploadFile(
    file: File,
    metadata: {
      title?: string;
      caption?: string;
      description?: string;
      categories: string[];
      tags?: string[];
      isFavorite?: boolean;
      takenAt?: string;
    },
    onProgress?: (percent: number) => void
  ): { promise: Promise<ApiResponse<MediaAsset>>; abort: () => void } {
    let xhrInstance: XMLHttpRequest | null = null;

    const promise = new Promise<ApiResponse<MediaAsset>>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrInstance = xhr;

      const formData = new FormData();
      formData.append('file', file);
      if (metadata.title) formData.append('title', metadata.title);
      if (metadata.caption) formData.append('caption', metadata.caption);
      if (metadata.description) formData.append('description', metadata.description);
      formData.append('categories', JSON.stringify(metadata.categories));
      if (metadata.tags && metadata.tags.length > 0) formData.append('tags', JSON.stringify(metadata.tags));
      if (metadata.isFavorite !== undefined) formData.append('isFavorite', String(metadata.isFavorite));
      if (metadata.takenAt) formData.append('takenAt', metadata.takenAt);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success && res.data) {
              const newAsset: MediaAsset = res.data;
              this.assets = [newAsset, ...this.assets.filter((a) => a.id !== newAsset.id)];
              this.saveToCache();
              this.notify();
              resolve({ success: true, data: newAsset });
            } else {
              resolve(res);
            }
          } catch {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.message || 'File upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload cancelled'));

      // Configure URL and headers
      const baseUrl = API_BASE_URL;
      xhr.open('POST', `${baseUrl}/media/upload`);

      // Authentication token with auto-recovery if missing or expired
      (async () => {
        let token =
          (typeof window !== 'undefined' &&
            (localStorage.getItem('couple_auth_token') || localStorage.getItem('auth_token'))) ||
          '';

        if (!token) {
          token = (await authService.ensureToken()) || '';
        }

        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.send(formData);
      })().catch((err) => {
        reject(new Error(err?.message || 'Authentication error during upload'));
      });
    });

    return {
      promise,
      abort: () => {
        if (xhrInstance) xhrInstance.abort();
      },
    };
  }

  /**
   * Bulk upload multiple files with individual and overall progress tracking
   */
  public async uploadMultiple(
    files: File[],
    commonMetadata: {
      categories: string[];
      tags?: string[];
      isFavorite?: boolean;
      commonTitle?: string;
    },
    onFileProgress?: (fileIndex: number, percent: number) => void,
    onOverallProgress?: (overallPercent: number) => void
  ): Promise<{ uploaded: MediaAsset[]; failedCount: number }> {
    const uploaded: MediaAsset[] = [];
    let failedCount = 0;
    const progressList = new Array(files.length).fill(0);

    const updateOverall = () => {
      if (onOverallProgress) {
        const sum = progressList.reduce((acc, curr) => acc + curr, 0);
        onOverallProgress(Math.round(sum / files.length));
      }
    };

    // Upload in concurrency batches of 3 to prevent mobile network choking
    const BATCH_SIZE = 3;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map((file, batchIdx) => {
        const globalIdx = i + batchIdx;
        const uploadObj = this.uploadFile(
          file,
          {
            title: commonMetadata.commonTitle ? `${commonMetadata.commonTitle} (${globalIdx + 1})` : file.name.replace(/\.[^/.]+$/, ''),
            categories: commonMetadata.categories,
            tags: commonMetadata.tags,
            isFavorite: commonMetadata.isFavorite,
          },
          (pct) => {
            progressList[globalIdx] = pct;
            if (onFileProgress) onFileProgress(globalIdx, pct);
            updateOverall();
          }
        );

        return uploadObj.promise
          .then((res) => {
            if (res.success && res.data) {
              uploaded.push(res.data);
            } else {
              failedCount++;
            }
          })
          .catch((err) => {
            console.error(`Failed to upload ${file.name}:`, err);
            failedCount++;
          });
      });

      await Promise.all(batchPromises);
    }

    if (onOverallProgress) onOverallProgress(100);
    return { uploaded, failedCount };
  }

  /**
   * Fetch media assets with filters
   */
  public async getMedia(params: MediaFilterParams = {}): Promise<ApiResponse<{ items: MediaAsset[]; total: number; page: number; pages: number }>> {
    try {
      const queryParams: Record<string, any> = {};
      if (params.category && params.category !== 'All' && params.category !== 'all') queryParams.category = params.category;
      if (params.mediaType && params.mediaType !== 'all') queryParams.mediaType = params.mediaType;
      if (params.favorite) queryParams.favorite = 'true';
      if (params.tag) queryParams.tag = params.tag;
      if (params.search) queryParams.search = params.search;
      if (params.page) queryParams.page = params.page;
      if (params.limit) queryParams.limit = params.limit;

      const res = await ApiClient.getInstance().get<{
        success: boolean;
        data: { items: MediaAsset[]; total: number; page: number; pages: number };
      }>('/media', { params: queryParams });

      if (res && res.success && res.data) {
        if (!params.search && (!params.page || params.page === 1)) {
          this.assets = res.data.items;
          this.saveToCache();
          this.notify();
        }
        return res;
      }
    } catch (err) {
      console.warn('Falling back to local cached media assets:', err);
    }

    // Fallback filter over cached data
    let filtered = [...this.assets];
    if (params.category && params.category !== 'All' && params.category !== 'all') {
      const cat = params.category.toLowerCase();
      filtered = filtered.filter((a) => a.categories && a.categories.includes(cat));
    }
    if (params.mediaType && params.mediaType !== 'all') {
      filtered = filtered.filter((a) => a.mediaType === params.mediaType);
    }
    if (params.favorite) {
      filtered = filtered.filter((a) => a.isFavorite);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.caption?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.originalFilename?.toLowerCase().includes(q) ||
          a.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return {
      success: true,
      data: {
        items: filtered,
        total: filtered.length,
        page: 1,
        pages: 1,
      },
    };
  }

  /**
   * Fetch all media mapped to a section (e.g. 'reels', 'memories', 'feed', 'trips', 'birthday', 'stories', 'gallery')
   */
  public async getMediaBySection(section: string): Promise<ApiResponse<MediaAsset[]>> {
    try {
      const res = await ApiClient.getInstance().get<{ success: boolean; data: MediaAsset[] }>(`/media/section/${section}`);
      if (res && res.success && Array.isArray(res.data)) {
        return res;
      }
    } catch {
      // fallback
    }

    const sec = section.toLowerCase();
    const filtered = this.assets.filter((a) => a.categories && a.categories.includes(sec));
    return { success: true, data: filtered };
  }

  /**
   * Update media metadata
   */
  public async updateMedia(id: string, updates: Partial<MediaAsset>): Promise<ApiResponse<MediaAsset>> {
    try {
      const res = await ApiClient.getInstance().patch<{ success: boolean; data: MediaAsset }>(`/media/${id}`, updates);
      if (res && res.success && res.data) {
        this.assets = this.assets.map((a) => (a.id === id ? res.data : a));
        this.saveToCache();
        this.notify();
        return res;
      }
    } catch (err) {
      console.warn('Failed to update media on server:', err);
    }

    // Optimistic fallback
    this.assets = this.assets.map((a) => (a.id === id ? { ...a, ...updates } : a));
    this.saveToCache();
    this.notify();
    const updated = this.assets.find((a) => a.id === id);
    return { success: true, data: updated };
  }

  /**
   * Bulk update categories/tags on multiple assets
   */
  public async bulkUpdate(
    ids: string[],
    payload: { addCategories?: string[]; removeCategories?: string[]; addTags?: string[]; isFavorite?: boolean }
  ): Promise<ApiResponse<{ modifiedCount: number }>> {
    try {
      const res = await ApiClient.getInstance().patch<{ success: boolean; data: { modifiedCount: number } }>(
        '/media/bulk/update',
        { ids, ...payload }
      );
      if (res && res.success) {
        // Refresh local cache
        this.getMedia({ limit: 100 });
        return res;
      }
    } catch (err) {
      console.warn('Failed to bulk update:', err);
    }

    return { success: true, data: { modifiedCount: ids.length } };
  }

  /**
   * Delete media asset
   * If removeFromCategory is provided, only removes that section tag without deleting the underlying media file!
   */
  public async deleteMedia(id: string, removeFromCategory?: string): Promise<ApiResponse<{ id: string }>> {
    try {
      const url = removeFromCategory ? `/media/${id}?removeFromCategory=${encodeURIComponent(removeFromCategory)}` : `/media/${id}`;
      const res = await ApiClient.getInstance().delete<{ success: boolean; data: any }>(url);
      if (res && res.success) {
        if (!removeFromCategory) {
          this.assets = this.assets.filter((a) => a.id !== id);
        } else {
          this.assets = this.assets.map((a) =>
            a.id === id ? { ...a, categories: a.categories.filter((c) => c !== removeFromCategory) } : a
          );
        }
        this.saveToCache();
        this.notify();
        return { success: true, data: { id } };
      }
    } catch (err) {
      console.warn('Failed to delete media on server:', err);
    }

    if (!removeFromCategory) {
      this.assets = this.assets.filter((a) => a.id !== id);
    }
    this.saveToCache();
    this.notify();
    return { success: true, data: { id } };
  }

  /**
   * Bulk delete multiple media files
   */
  public async bulkDelete(ids: string[]): Promise<ApiResponse<{ deletedCount: number }>> {
    try {
      const res = await ApiClient.getInstance().post<{ success: boolean; data: { deletedCount: number } }>(
        '/media/bulk/delete',
        { ids }
      );
      if (res && res.success) {
        this.assets = this.assets.filter((a) => !ids.includes(a.id));
        this.saveToCache();
        this.notify();
        return res;
      }
    } catch (err) {
      console.warn('Failed to bulk delete media:', err);
    }

    this.assets = this.assets.filter((a) => !ids.includes(a.id));
    this.saveToCache();
    this.notify();
    return { success: true, data: { deletedCount: ids.length } };
  }

  /**
   * Toggle favorite
   */
  public async toggleFavorite(id: string): Promise<boolean> {
    const asset = this.assets.find((a) => a.id === id);
    const newFav = asset ? !asset.isFavorite : true;
    await this.updateMedia(id, { isFavorite: newFav });
    return newFav;
  }
}

export const mediaService = new MediaService();
