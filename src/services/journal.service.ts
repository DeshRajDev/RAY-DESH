import { JournalEntry, ApiResponse } from '@/types';
import { initialJournal } from '@/constants/initial-data';
import { ApiClient } from './api/client';

const JOURNAL_STORAGE_KEY = 'sanctuary_journal_v3';

class JournalService {
  private entries: JournalEntry[] = [];
  private listeners: ((entries: JournalEntry[]) => void)[] = [];

  constructor() {
    this.loadEntries();
  }

  private loadEntries(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(JOURNAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.entries = parsed;
            return;
          }
        }
      } catch {
        // Fallback
      }
    }
    this.entries = [...initialJournal];
  }

  private saveEntries(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(this.entries));
      } catch {
        // ignore
      }
    }
  }

  public async getEntries(): Promise<ApiResponse<JournalEntry[]>> {
    try {
      if (typeof window !== 'undefined') {
        const res = await ApiClient.getInstance().get<{ success: boolean; data: any[] }>('/journal');
        if (res && res.success && Array.isArray(res.data)) {
          const formatted: JournalEntry[] = res.data.map(item => ({
            id: item.id || item._id,
            authorId: item.authorId,
            authorName: item.authorName || 'Partner',
            date: item.date,
            title: item.title,
            content: item.content,
            mood: item.mood || 'romantic',
            weather: item.weather,
            location: item.location,
            photos: item.photos || [],
            isPrivate: !!item.isPrivate,
            musicTrack: item.musicTrack,
            isFavorite: !!item.isFavorite,
            partnerRead: !!item.partnerRead,
            reactions: item.reactions || [],
            createdAt: item.createdAt || new Date().toISOString(),
          }));
          this.entries = formatted;
          this.saveEntries();
        }
      }
    } catch {
      // Fallback
    }

    return { success: true, data: [...this.entries] };
  }

  public async addEntry(payload: Omit<JournalEntry, 'id' | 'reactions'>): Promise<ApiResponse<JournalEntry>> {
    let newEntry: JournalEntry;
    try {
      const res = await ApiClient.getInstance().post<{ success: boolean; data: any }>('/journal', payload);
      if (res && res.success && res.data) {
        const item = res.data;
        newEntry = {
          id: item.id || item._id,
          authorId: item.authorId,
          authorName: payload.authorName,
          date: item.date,
          title: item.title,
          content: item.content,
          mood: item.mood,
          weather: item.weather,
          location: item.location,
          photos: item.photos || [],
          isPrivate: !!item.isPrivate,
          musicTrack: item.musicTrack,
          isFavorite: false,
          partnerRead: false,
          reactions: [],
        };
      } else {
        throw new Error('Failed to create journal entry');
      }
    } catch {
      newEntry = {
        ...payload,
        id: `jnl_${Date.now()}`,
        reactions: [],
        partnerRead: false,
      };
    }

    this.entries.unshift(newEntry);
    this.saveEntries();
    this.notify();
    return { success: true, data: newEntry };
  }

  public async reactToEntry(id: string, emoji: string, userId: string): Promise<ApiResponse<JournalEntry>> {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) throw new Error('Entry not found');
    if (!entry.reactions) entry.reactions = [];
    entry.reactions.push({ emoji, userId });

    try {
      await ApiClient.getInstance().post(`/journal/${id}/react`, { emoji });
    } catch (err) {
      console.warn('Journal reaction sync error:', err);
    }

    this.saveEntries();
    this.notify();
    return { success: true, data: { ...entry } };
  }

  public async deleteEntry(id: string): Promise<ApiResponse<boolean>> {
    this.entries = this.entries.filter(e => e.id !== id);
    try {
      await ApiClient.getInstance().delete(`/journal/${id}`);
    } catch (err) {
      console.warn('Journal delete sync error:', err);
    }

    this.saveEntries();
    this.notify();
    return { success: true, data: true };
  }

  public subscribe(listener: (entries: JournalEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.entries]));
  }
}

export const journalService = new JournalService();
