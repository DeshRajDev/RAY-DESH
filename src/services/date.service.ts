import { DateEvent, ApiResponse } from '@/types';
import { initialDates } from '@/constants/initial-data';
import { getNextOccurrence } from '@/lib/date-utils';
import { ApiClient } from './api/client';

const DATES_STORAGE_KEY = 'sanctuary_dates_v3';

class DateService {
  private dates: DateEvent[] = [];
  private listeners: ((dates: DateEvent[]) => void)[] = [];

  constructor() {
    this.loadDates();
  }

  private loadDates(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(DATES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.dates = parsed;
            return;
          }
        }
      } catch {
        // Fallback
      }
    }
    this.dates = [...initialDates];
  }

  private saveDates(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DATES_STORAGE_KEY, JSON.stringify(this.dates));
      } catch {
        // Ignore quota errors
      }
    }
  }

  public async getDates(): Promise<ApiResponse<DateEvent[]>> {
    try {
      if (typeof window !== 'undefined') {
        const res = await ApiClient.getInstance().get<{ success: boolean; data: any[] }>('/dates');
        if (res && res.success && Array.isArray(res.data)) {
          const formatted: DateEvent[] = res.data.map(item => ({
            id: item.id || item._id,
            title: item.title,
            date: item.date,
            type: item.type || 'Special',
            description: item.description || '',
            location: item.location || '',
            isRecurringYearly: !!item.isRecurringYearly,
            remindDaysBefore: item.remindDaysBefore || [1],
            photos: item.photos || [],
            notes: item.notes || '',
          }));
          this.dates = formatted;
          this.saveDates();
        }
      }
    } catch {
      // Fallback
    }

    const sorted = [...this.dates].sort((a, b) => {
      const nextA = a.isRecurringYearly ? getNextOccurrence(a.date).getTime() : new Date(a.date).getTime();
      const nextB = b.isRecurringYearly ? getNextOccurrence(b.date).getTime() : new Date(b.date).getTime();
      return nextA - nextB;
    });
    return { success: true, data: sorted };
  }

  public async addDate(payload: Omit<DateEvent, 'id'>): Promise<ApiResponse<DateEvent>> {
    let newDate: DateEvent;
    try {
      const res = await ApiClient.getInstance().post<{ success: boolean; data: any }>('/dates', payload);
      if (res && res.success && res.data) {
        const item = res.data;
        newDate = {
          id: item.id || item._id,
          title: item.title,
          date: item.date,
          type: item.type,
          description: item.description || '',
          location: item.location || '',
          isRecurringYearly: !!item.isRecurringYearly,
          remindDaysBefore: item.remindDaysBefore || [1],
          photos: item.photos || [],
          notes: item.notes || '',
        };
      } else {
        throw new Error('Failed to create date');
      }
    } catch {
      newDate = {
        ...payload,
        id: `date_${Date.now()}`,
      };
    }

    this.dates.push(newDate);
    this.saveDates();
    this.notify();
    return { success: true, data: newDate };
  }

  public async deleteDate(id: string): Promise<ApiResponse<boolean>> {
    this.dates = this.dates.filter(d => d.id !== id);
    try {
      await ApiClient.getInstance().delete(`/dates/${id}`);
    } catch (err) {
      console.warn('Date delete sync error:', err);
    }

    this.saveDates();
    this.notify();
    return { success: true, data: true };
  }

  public subscribe(listener: (dates: DateEvent[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.dates]));
  }
}

export const dateService = new DateService();
