import { Milestone, ApiResponse } from '@/types';
import { ApiClient } from './api/client';

class TimelineService {
  private milestones: Milestone[] = [];
  private listeners: ((milestones: Milestone[]) => void)[] = [];

  public async getMilestones(): Promise<ApiResponse<Milestone[]>> {
    try {
      const res = await ApiClient.get<ApiResponse<Milestone[]>>('/timeline');
      if (res && res.success && Array.isArray(res.data)) {
        this.milestones = res.data;
        const sorted = [...this.milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        this.notify();
        return { success: true, data: sorted };
      }
    } catch {
      // Fallback
    }
    const sorted = [...this.milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return { success: true, data: sorted };
  }

  public async addMilestone(payload: Omit<Milestone, 'id'>): Promise<ApiResponse<Milestone>> {
    try {
      const res = await ApiClient.post<ApiResponse<Milestone>>('/timeline', payload);
      if (res && res.success && res.data) {
        this.milestones.push(res.data);
        this.notify();
        return res;
      }
    } catch (err) {
      console.error('Failed to add milestone via backend', err);
    }

    const newM: Milestone = {
      ...payload,
      id: `mls_${Date.now()}`,
    };
    this.milestones.push(newM);
    this.notify();
    return { success: true, data: newM };
  }

  public async deleteMilestone(id: string): Promise<ApiResponse<boolean>> {
    try {
      await ApiClient.delete(`/timeline/${id}`);
    } catch (err) {
      console.error('Failed to delete milestone via backend', err);
    }

    this.milestones = this.milestones.filter(m => m.id !== id);
    this.notify();
    return { success: true, data: true };
  }

  public subscribe(listener: (milestones: Milestone[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.milestones]));
  }
}

export const timelineService = new TimelineService();
