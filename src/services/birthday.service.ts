import { BirthdayData, BirthdayPlan, BirthdayGiftWish, ApiResponse } from '@/types';
import { ApiClient } from './api/client';

const initialEmptyBirthdayData: BirthdayData = {
  partnerBirthday: '',
  myBirthday: '',
  partnerName: '',
  plans: [],
  wishes: [],
  specialMessageForPartner: '',
  specialMessageFromPartner: '',
};

class BirthdayService {
  private birthdayData: BirthdayData = { ...initialEmptyBirthdayData };
  private listeners: ((data: BirthdayData) => void)[] = [];

  public async getBirthdayData(): Promise<ApiResponse<BirthdayData>> {
    try {
      const res = await ApiClient.get<ApiResponse<BirthdayData>>('/birthdays');
      if (res && res.success && res.data) {
        this.birthdayData = {
          partnerBirthday: res.data.partnerBirthday || '',
          myBirthday: res.data.myBirthday || '',
          partnerName: res.data.partnerName || '',
          plans: Array.isArray(res.data.plans) ? res.data.plans : [],
          wishes: Array.isArray(res.data.wishes) ? res.data.wishes : [],
          specialMessageForPartner: res.data.specialMessageForPartner || '',
          specialMessageFromPartner: res.data.specialMessageFromPartner || '',
        };
        this.notify();
        return { success: true, data: { ...this.birthdayData } };
      }
    } catch {
      // Fallback
    }
    return { success: true, data: { ...this.birthdayData } };
  }

  public async addPlan(plan: Omit<BirthdayPlan, 'id'>): Promise<ApiResponse<BirthdayPlan>> {
    try {
      const res = await ApiClient.post<ApiResponse<BirthdayPlan>>('/birthdays/plans', plan);
      if (res && res.success && res.data) {
        this.birthdayData.plans.push(res.data);
        this.notify();
        return res;
      }
    } catch (err) {
      console.error('Failed to add birthday plan via backend', err);
    }

    const newPlan: BirthdayPlan = {
      ...plan,
      id: `bplan_${Date.now()}`,
    };
    this.birthdayData.plans.push(newPlan);
    this.notify();
    return { success: true, data: newPlan };
  }

  public async togglePlanStatus(id: string, status: BirthdayPlan['status']): Promise<ApiResponse<BirthdayPlan>> {
    const plan = this.birthdayData.plans.find(p => p.id === id);
    if (!plan) throw new Error('Plan not found');
    plan.status = status;
    this.notify();
    return { success: true, data: { ...plan } };
  }

  public async addWish(wish: Omit<BirthdayGiftWish, 'id'>): Promise<ApiResponse<BirthdayGiftWish>> {
    try {
      const res = await ApiClient.post<ApiResponse<BirthdayGiftWish>>('/birthdays/wishes', wish);
      if (res && res.success && res.data) {
        this.birthdayData.wishes.push(res.data);
        this.notify();
        return res;
      }
    } catch (err) {
      console.error('Failed to add wish via backend', err);
    }

    const newWish: BirthdayGiftWish = {
      ...wish,
      id: `bwish_${Date.now()}`,
    };
    this.birthdayData.wishes.push(newWish);
    this.notify();
    return { success: true, data: newWish };
  }

  public async toggleClaimWish(id: string): Promise<ApiResponse<BirthdayGiftWish>> {
    try {
      const res = await ApiClient.post<ApiResponse<BirthdayGiftWish>>(`/birthdays/wishes/${id}/toggle-claim`);
      if (res && res.success && res.data) {
        const idx = this.birthdayData.wishes.findIndex(w => w.id === id);
        if (idx > -1) {
          this.birthdayData.wishes[idx] = res.data;
          this.notify();
        }
        return res;
      }
    } catch (err) {
      console.error('Failed to toggle claim via backend', err);
    }

    const wish = this.birthdayData.wishes.find(w => w.id === id);
    if (!wish) throw new Error('Wish not found');
    wish.isClaimed = !wish.isClaimed;
    this.notify();
    return { success: true, data: { ...wish } };
  }

  public subscribe(listener: (data: BirthdayData) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.birthdayData }));
  }
}

export const birthdayService = new BirthdayService();
