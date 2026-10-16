import { DateEvent, ApiResponse } from '@/types';
import { initialDates } from '@/constants/initial-data';
import { getNextOccurrence } from '@/lib/date-utils';

class DateService {
  private dates: DateEvent[] = [...initialDates];
  private listeners: ((dates: DateEvent[]) => void)[] = [];

  public async getDates(): Promise<ApiResponse<DateEvent[]>> {
    // Sort by next upcoming occurrence
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
    this.notify();
    return { success: true, data: newDate };
  }

  public async deleteDate(id: string): Promise<ApiResponse<boolean>> {
    this.dates = this.dates.filter(d => d.id !== id);
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
