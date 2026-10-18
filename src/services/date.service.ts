import { DateEvent, ApiResponse } from '@/types';
import { initialDates } from '@/constants/initial-data';
import { getNextOccurrence } from '@/lib/date-utils';

const DATES_STORAGE_KEY = 'sanctuary_dates_v2';

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
          if (Array.isArray(parsed) && parsed.length > 0) {
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
    const sorted = [...this.dates].sort((a, b) => {
      const nextA = a.isRecurringYearly ? getNextOccurrence(a.date).getTime() : new Date(a.date).getTime();
      const nextB = b.isRecurringYearly ? getNextOccurrence(b.date).getTime() : new Date(b.date).getTime();
      return nextA - nextB;
    });
    return { success: true, data: sorted };
  }

  public async addDate(payload: Omit<DateEvent, 'id'>): Promise<ApiResponse<DateEvent>> {
    const newDate: DateEvent = {
      ...payload,
      id: `date_${Date.now()}`,
    };
    this.dates.push(newDate);
    this.saveDates();
    this.notify();
    return { success: true, data: newDate };
  }

  public async deleteDate(id: string): Promise<ApiResponse<boolean>> {
    this.dates = this.dates.filter(d => d.id !== id);
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
