import { Trip, ApiResponse } from '@/types';
import { initialTrips } from '@/constants/initial-data';
import { ApiClient } from './api/client';

const TRIPS_STORAGE_KEY = 'sanctuary_trips_v3';

class TripService {
  private trips: Trip[] = [];
  private listeners: ((trips: Trip[]) => void)[] = [];

  constructor() {
    this.loadTrips();
  }

  private loadTrips(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(TRIPS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.trips = parsed;
            return;
          }
        }
      } catch {
        // Fallback
      }
    }
    this.trips = [...initialTrips];
  }

  private saveTrips(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(this.trips));
      } catch {
        // ignore
      }
    }
  }

  public async getTrips(): Promise<ApiResponse<Trip[]>> {
    try {
      if (typeof window !== 'undefined') {
        const res = await ApiClient.getInstance().get<{ success: boolean; data: any[] }>('/trips');
        if (res && res.success && Array.isArray(res.data)) {
          const formatted: Trip[] = res.data.map(item => ({
            id: item.id || item._id,
            title: item.title,
            destination: item.destination,
            startDate: item.startDate,
            endDate: item.endDate,
            coverUrl: item.coverUrl,
            status: item.status || 'planned',
            itinerary: item.itinerary || [],
            locations: item.locations || [],
            packingList: item.packingList || [],
            memoriesCount: item.memoriesCount || 0,
            notes: item.notes,
            createdAt: item.createdAt || new Date().toISOString(),
          }));
          this.trips = formatted;
          this.saveTrips();
        }
      }
    } catch {
      // Fallback
    }

    return { success: true, data: [...this.trips] };
  }

  public async getTripById(id: string): Promise<ApiResponse<Trip | null>> {
    try {
      if (typeof window !== 'undefined') {
        const res = await ApiClient.getInstance().get<{ success: boolean; data: any }>(`/trips/${id}`);
        if (res && res.success && res.data) {
          const item = res.data;
          const formatted: Trip = {
            id: item.id || item._id,
            title: item.title,
            destination: item.destination,
            startDate: item.startDate,
            endDate: item.endDate,
            coverUrl: item.coverUrl,
            status: item.status || 'planned',
            itinerary: item.itinerary || [],
            locations: item.locations || [],
            packingList: item.packingList || [],
            memoriesCount: item.memoriesCount || 0,
            notes: item.notes,
            createdAt: item.createdAt || new Date().toISOString(),
          };
          return { success: true, data: formatted };
        }
      }
    } catch {
      // Fallback
    }

    const trip = this.trips.find(t => t.id === id) || null;
    return { success: true, data: trip };
  }

  public async createTrip(payload: Omit<Trip, 'id' | 'createdAt'>): Promise<ApiResponse<Trip>> {
    let newTrip: Trip;
    try {
      const res = await ApiClient.getInstance().post<{ success: boolean; data: any }>('/trips', payload);
      if (res && res.success && res.data) {
        const item = res.data;
        newTrip = {
          id: item.id || item._id,
          title: item.title,
          destination: item.destination,
          startDate: item.startDate,
          endDate: item.endDate,
          coverUrl: item.coverUrl,
          status: item.status || 'planned',
          itinerary: item.itinerary || [],
          locations: item.locations || [],
          packingList: item.packingList || [],
          memoriesCount: 0,
          notes: item.notes,
          createdAt: item.createdAt || new Date().toISOString(),
        };
      } else {
        throw new Error('Failed to create trip');
      }
    } catch {
      newTrip = {
        ...payload,
        id: `trip_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
    }

    this.trips.unshift(newTrip);
    this.saveTrips();
    this.notify();
    return { success: true, data: newTrip };
  }

  public async deleteTrip(id: string): Promise<ApiResponse<boolean>> {
    this.trips = this.trips.filter(t => t.id !== id);
    try {
      await ApiClient.getInstance().delete(`/trips/${id}`);
    } catch (err) {
      console.warn('Trip delete sync error:', err);
    }

    this.saveTrips();
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
