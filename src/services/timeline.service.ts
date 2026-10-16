import { Milestone, ApiResponse } from '@/types';
import { initialMilestones } from '@/constants/initial-data';

class TimelineService {
  private milestones: Milestone[] = [...initialMilestones];
  private listeners: ((milestones: Milestone[]) => void)[] = [];

  public async getMilestones(): Promise<ApiResponse<Milestone[]>> {
    const sorted = [...this.milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return { success: true, data: sorted };
  }

  public async addMilestone(payload: Omit<Milestone, 'id'>): Promise<ApiResponse<Milestone>> {
    const newM: Milestone = {
      ...payload,
      id: `mls_${Date.now()}`,
    };
    this.milestones.push(newM);
    this.notify();
    return { success: true, data: newM };
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
