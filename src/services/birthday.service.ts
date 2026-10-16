import { BirthdayData, BirthdayPlan, BirthdayGiftWish, ApiResponse } from '@/types';
import { initialBirthdayData } from '@/constants/initial-data';

class BirthdayService {
  private birthdayData: BirthdayData = { ...initialBirthdayData };
  private listeners: ((data: BirthdayData) => void)[] = [];

  public async getBirthdayData(): Promise<ApiResponse<BirthdayData>> {
    return { success: true, data: { ...this.birthdayData } };
  }

  public async addPlan(plan: Omit<BirthdayPlan, 'id'>): Promise<ApiResponse<BirthdayPlan>> {
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
    const newWish: BirthdayGiftWish = {
      ...wish,
      id: `bwish_${Date.now()}`,
    };
    this.birthdayData.wishes.push(newWish);
    this.notify();
    return { success: true, data: newWish };
  }

  public async toggleClaimWish(id: string): Promise<ApiResponse<BirthdayGiftWish>> {
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
