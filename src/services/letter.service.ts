import { LoveLetter, ApiResponse } from '@/types';
import { initialLetters } from '@/constants/initial-data';

class LetterService {
  private letters: LoveLetter[] = [...initialLetters];
  private listeners: ((letters: LoveLetter[]) => void)[] = [];

  public async getLetters(): Promise<ApiResponse<LoveLetter[]>> {
    return { success: true, data: [...this.letters] };
  }

  public async createLetter(payload: Omit<LoveLetter, 'id' | 'isOpened' | 'createdAt'>): Promise<ApiResponse<LoveLetter>> {
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
