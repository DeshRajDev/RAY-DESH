import { LoveLetter, ApiResponse } from '@/types';
import { ApiClient } from './api/client';

class LetterService {
  private letters: LoveLetter[] = [];
  private listeners: ((letters: LoveLetter[]) => void)[] = [];

  public async getLetters(): Promise<ApiResponse<LoveLetter[]>> {
    try {
      const res = await ApiClient.get<ApiResponse<LoveLetter[]>>('/love-letters');
      if (res && res.success && Array.isArray(res.data)) {
        this.letters = res.data;
        this.notify();
        return res;
      }
    } catch {
      // Fallback
    }
    return { success: true, data: [...this.letters] };
  }

  public async createLetter(payload: Omit<LoveLetter, 'id' | 'isOpened' | 'createdAt'>): Promise<ApiResponse<LoveLetter>> {
    try {
      const res = await ApiClient.post<ApiResponse<LoveLetter>>('/love-letters', payload);
      if (res && res.success && res.data) {
        this.letters.unshift(res.data);
        this.notify();
        return res;
      }
    } catch (err) {
      console.error('Failed to create love letter via backend', err);
    }

    const newLetter: LoveLetter = {
      ...payload,
      id: `let_${Date.now()}`,
      isOpened: false,
      createdAt: new Date().toISOString(),
    };
    this.letters.unshift(newLetter);
    this.notify();
    return { success: true, data: newLetter };
  }

  public async unsealLetter(id: string): Promise<ApiResponse<LoveLetter>> {
    try {
      const res = await ApiClient.post<ApiResponse<LoveLetter>>(`/love-letters/${id}/open`);
      if (res && res.success && res.data) {
        const idx = this.letters.findIndex(l => l.id === id);
        if (idx > -1) {
          this.letters[idx] = res.data;
          this.notify();
        }
        return res;
      }
    } catch (err) {
      console.error('Failed to unseal letter via backend', err);
    }

    const letter = this.letters.find(l => l.id === id);
    if (!letter) throw new Error('Letter not found');
    letter.isOpened = true;
    letter.openedAt = new Date().toISOString();
    this.notify();
    return { success: true, data: { ...letter } };
  }

  public subscribe(listener: (letters: LoveLetter[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.letters]));
  }
}

export const letterService = new LetterService();
