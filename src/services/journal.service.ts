import { JournalEntry, ApiResponse } from '@/types';
import { initialJournal } from '@/constants/initial-data';

class JournalService {
  private entries: JournalEntry[] = [...initialJournal];
  private listeners: ((entries: JournalEntry[]) => void)[] = [];

  public async getEntries(): Promise<ApiResponse<JournalEntry[]>> {
    return { success: true, data: [...this.entries] };
  }

  public async addEntry(payload: Omit<JournalEntry, 'id' | 'reactions'>): Promise<ApiResponse<JournalEntry>> {
    const newEntry: JournalEntry = {
      ...payload,
      id: `jnl_${Date.now()}`,
      reactions: [],
      partnerRead: false,
    };
    this.entries.unshift(newEntry);
    this.notify();
    return { success: true, data: newEntry };
  }

  public async reactToEntry(id: string, emoji: string, userId: string): Promise<ApiResponse<JournalEntry>> {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) throw new Error('Entry not found');
    if (!entry.reactions) entry.reactions = [];
    entry.reactions.push({ emoji, userId });
    this.notify();
    return { success: true, data: { ...entry } };
  }

  public async deleteEntry(id: string): Promise<ApiResponse<boolean>> {
    this.entries = this.entries.filter(e => e.id !== id);
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
