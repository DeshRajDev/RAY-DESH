import { Place, ApiResponse } from '@/types';
import { initialPlaces } from '@/constants/initial-data';

const PLACES_STORAGE_KEY = 'sanctuary_places_v2';

class PlaceService {
  private places: Place[] = [];
  private listeners: ((places: Place[]) => void)[] = [];

  constructor() {
    this.loadPlaces();
  }

  private loadPlaces(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(PLACES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.places = parsed;
            return;
          }
        }
      } catch {
        // Fallback to initial places
      }
    }
    this.places = [...initialPlaces];
  }

  private savePlaces(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PLACES_STORAGE_KEY, JSON.stringify(this.places));
      } catch {
        // Ignore quota errors
      }
    }
  }

  public async getPlaces(category?: 'Been' | 'WantToGo'): Promise<ApiResponse<Place[]>> {
    if (category) {
      return { success: true, data: this.places.filter(p => p.category === category) };
    }
    return { success: true, data: [...this.places] };
  }

  public async addPlace(payload: Omit<Place, 'id'>): Promise<ApiResponse<Place>> {
    const newPlace: Place = {
      ...payload,
      id: `plc_${Date.now()}`,
    };
    this.places.unshift(newPlace);
    this.savePlaces();
    this.notify();
    return { success: true, data: newPlace };
  }

  public async toggleFavorite(id: string): Promise<ApiResponse<Place>> {
    const place = this.places.find(p => p.id === id);
    if (!place) throw new Error('Place not found');
    place.isFavorite = !place.isFavorite;
    this.savePlaces();
    this.notify();
    return { success: true, data: { ...place } };
  }

  public async deletePlace(id: string): Promise<ApiResponse<boolean>> {
    this.places = this.places.filter(p => p.id !== id);
    this.savePlaces();
    this.notify();
    return { success: true, data: true };
  }

  public subscribe(listener: (places: Place[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.places]));
  }
}

export const placeService = new PlaceService();
