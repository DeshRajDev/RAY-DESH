import { Trip, ApiResponse } from '@/types';
import { initialTrips } from '@/constants/initial-data';

class TripService {
  private trips: Trip[] = [...initialTrips];
  private listeners: ((trips: Trip[]) => void)[] = [];

  public async getTrips(): Promise<ApiResponse<Trip[]>> {
    return { success: true, data: [...this.trips] };
  }

  public async getTripById(id: string): Promise<ApiResponse<Trip | null>> {
    const trip = this.trips.find(t => t.id === id) || null;
    return { success: true, data: trip };
  }

  public async createTrip(payload: Omit<Trip, 'id' | 'createdAt'>): Promise<ApiResponse<Trip>> {
    const newTrip: Trip = {
      ...payload,
      id: `trip_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.trips.unshift(newTrip);
    this.notify();
    return { success: true, data: newTrip };
  }

  public async deleteTrip(id: string): Promise<ApiResponse<boolean>> {
    this.trips = this.trips.filter(t => t.id !== id);
    this.notify();
    return { success: true, data: true };
  }

  public subscribe(listener: (trips: Trip[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.trips]));
  }
}

export const tripService = new TripService();
