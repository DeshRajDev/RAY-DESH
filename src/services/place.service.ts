import { Place, ApiResponse } from '@/types';
import { initialPlaces } from '@/constants/initial-data';
import { ApiClient } from './api/client';

const PLACES_STORAGE_KEY = 'sanctuary_places_v3';

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
          if (Array.isArray(parsed)) {
            this.places = parsed;
            return;
          }
        }
      } catch {
        // Fallback
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
    try {
      if (typeof window !== 'undefined') {
        const res = await ApiClient.getInstance().get<{ success: boolean; data: any[] }>('/places');
        if (res && res.success && Array.isArray(res.data)) {
          const formatted: Place[] = res.data.map(item => ({
            id: item.id || item._id,
            name: item.name,
            category: (item.category === 'been' ? 'Been' : 'WantToGo') as Place['category'],
            country: item.country,
            city: item.city,
            coordinates: item.coordinates,
            visitedDate: item.visitedDate,
            rating: item.rating,
            notes: item.notes,
            photos: item.photos || [],
            isFavorite: !!item.isFavorite,
          }));
          this.places = formatted;
          this.savePlaces();
        }
      }
    } catch {
      // Fallback
    }

    if (category) {
      return { success: true, data: this.places.filter(p => p.category === category) };
    }
    return { success: true, data: [...this.places] };
  }

  public async addPlace(payload: Omit<Place, 'id'>): Promise<ApiResponse<Place>> {
    let newPlace: Place;
    try {
      const backendCategory = payload.category === 'Been' ? 'been' : 'want_to_go';
      const res = await ApiClient.getInstance().post<{ success: boolean; data: any }>('/places', {
        name: payload.name,
        category: backendCategory,
        country: payload.country,
        city: payload.city,
        coordinates: payload.coordinates,
        visitedDate: payload.visitedDate,
        rating: payload.rating,
        notes: payload.notes,
        photos: payload.photos || [],
      });

      if (res && res.success && res.data) {
        const item = res.data;
        newPlace = {
          id: item.id || item._id,
          name: item.name,
          category: (item.category === 'been' ? 'Been' : 'WantToGo') as Place['category'],
          country: item.country,
          city: item.city,
          coordinates: item.coordinates,
          visitedDate: item.visitedDate,
          rating: item.rating,
          notes: item.notes,
          photos: item.photos || [],
          isFavorite: !!item.isFavorite,
        };
      } else {
        throw new Error('Failed to save place');
      }
    } catch {
      newPlace = {
        ...payload,
        id: `plc_${Date.now()}`,
      };
    }

    this.places.unshift(newPlace);
    this.savePlaces();
    this.notify();
    return { success: true, data: newPlace };
  }

  public async toggleFavorite(id: string): Promise<ApiResponse<Place>> {
    const place = this.places.find(p => p.id === id);
    if (!place) throw new Error('Place not found');
    place.isFavorite = !place.isFavorite;

    try {
      await ApiClient.getInstance().post(`/places/${id}/favorite`);
    } catch (err) {
      console.warn('Place favorite sync error:', err);
    }

    this.savePlaces();
    this.notify();
    return { success: true, data: { ...place } };
  }

  public async deletePlace(id: string): Promise<ApiResponse<boolean>> {
    this.places = this.places.filter(p => p.id !== id);
    try {
      await ApiClient.getInstance().delete(`/places/${id}`);
    } catch (err) {
      console.warn('Place delete sync error:', err);
    }

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
