import { User, Couple, ApiResponse } from '@/types';
import { initialCouple } from '@/constants/initial-data';
import { authService } from './auth.service';
import { ApiClient } from './api/client';

const COUPLE_STORAGE_KEY = 'sanctuary_couple_settings_v2';

class UserService {
  private couple: Couple = { ...initialCouple };
  private listeners: ((couple: Couple) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const storedCouple = localStorage.getItem(COUPLE_STORAGE_KEY);
        if (storedCouple) {
          this.couple = { ...this.couple, ...JSON.parse(storedCouple) };
        }
      } catch {
        // ignore
      }
    }

    authService.subscribe(() => {
      this.notify();
    });
  }

  public async getCoupleProfile(): Promise<ApiResponse<Couple>> {
    const { me, partner } = authService.getAllUsers();
    try {
      if (typeof window !== 'undefined') {
        const res = await ApiClient.getInstance().get<{ success: boolean; data: any }>('/couples');
        if (res && res.success && res.data) {
          const c = res.data;
          this.couple = {
            id: c.id || c._id || this.couple.id,
            partner1: me.id === 'user_1' ? me : partner,
            partner2: me.id === 'user_2' ? me : partner,
            anniversaryDate: c.anniversaryDate || this.couple.anniversaryDate,
            relationshipStartDate: c.relationshipStartDate || this.couple.relationshipStartDate,
            customTitle: c.customTitle || 'Ray — किरण',
            theme: c.theme || 'dark',
            coupleAvatar: c.coupleAvatar || this.couple.coupleAvatar,
            soundEnabled: c.soundEnabled ?? true,
            privacyPinEnabled: c.privacyPinEnabled ?? false,
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem(COUPLE_STORAGE_KEY, JSON.stringify(this.couple));
          }
        }
      }
    } catch {
      // Fallback to local
    }

    return {
      success: true,
      data: {
        ...this.couple,
        partner1: me.id === 'user_1' ? me : partner,
        partner2: me.id === 'user_2' ? me : partner,
      },
    };
  }

  public async updateProfile(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    const updated = await authService.updateUserProfile(userId, updates);
    this.notify();
    return { success: true, data: updated };
  }

  public async updateCoupleSettings(updates: Partial<Couple>): Promise<ApiResponse<Couple>> {
    this.couple = { ...this.couple, ...updates };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(COUPLE_STORAGE_KEY, JSON.stringify(this.couple));
      } catch {
        // ignore
      }
    }

    try {
      await ApiClient.getInstance().patch('/couples/settings', updates);
    } catch (err) {
      console.warn('Couple settings backend sync error:', err);
    }

    this.notify();
    return { success: true, data: { ...this.couple } };
  }

  public subscribe(listener: (couple: Couple) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const { me, partner } = authService.getAllUsers();
    const payload = {
      ...this.couple,
      partner1: me.id === 'user_1' ? me : partner,
      partner2: me.id === 'user_2' ? me : partner,
    };
    this.listeners.forEach(l => l(payload));
  }
}

export const userService = new UserService();
