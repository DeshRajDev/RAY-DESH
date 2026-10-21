import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface NormalizedJamendoTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  shareUrl: string;
  licenseUrl?: string;
  downloadAllowed: boolean;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class JamendoService {
  private static instance: JamendoService;
  private cache: Map<string, CacheEntry<NormalizedJamendoTrack[]>> = new Map();
  private readonly defaultTimeoutMs = 8000;
  private readonly baseUrl = 'https://api.jamendo.com/v3.0/tracks/';

  private constructor() {}

  public static getInstance(): JamendoService {
    if (!JamendoService.instance) {
      JamendoService.instance = new JamendoService();
    }
    return JamendoService.instance;
  }

  public isConfigured(): boolean {
    return Boolean(env.JAMENDO_CLIENT_ID && env.JAMENDO_CLIENT_ID.trim().length > 0);
  }

  private getCached(key: string): NormalizedJamendoTrack[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache(key: string, data: NormalizedJamendoTrack[], ttlSeconds: number = 300) {
    // Keep cache map size bounded to max 100 entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private normalizeTrack(raw: any): NormalizedJamendoTrack {
    return {
      id: String(raw.id),
      title: String(raw.name || 'Untitled').trim(),
      artist: String(raw.artist_name || 'Unknown Artist').trim(),
      album: String(raw.album_name || '').trim(),
      duration: Number(raw.duration) || 180,
      coverUrl: raw.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      audioUrl: raw.audio || '',
      shareUrl: raw.shareurl || `https://www.jamendo.com/track/${raw.id}`,
      licenseUrl: raw.license_ccurl || undefined,
      downloadAllowed: Boolean(raw.audiodownload_allowed),
    };
  }

  private async fetchFromJamendo(params: Record<string, string | number>): Promise<NormalizedJamendoTrack[]> {
    if (!this.isConfigured()) {
      const err = new Error('Jamendo API client ID is not configured on the server. Please set JAMENDO_CLIENT_ID in your environment.');
      (err as any).code = 'JAMENDO_NOT_CONFIGURED';
      (err as any).statusCode = 503;
      throw err;
    }

    const clientId = env.JAMENDO_CLIENT_ID!.trim();
    const searchParams = new URLSearchParams({
      client_id: clientId,
      format: 'json',
      audioformat: 'mp32',
      include: 'musicinfo+licenses',
    });

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, String(v));
      }
    });

    const url = `${this.baseUrl}?${searchParams.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'RayCoupleSanctuary/1.0',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Jamendo API responded with status ${response.status} ${response.statusText}`);
      }

      const json = await response.json();

      if (json.headers?.status === 'failed') {
        const errorMsg = json.headers?.error_message || 'Jamendo API request failed';
        logger.warn({ jamendoError: json.headers }, 'Jamendo API returned failed status');
        throw new Error(errorMsg);
      }

      const results = Array.isArray(json.results) ? json.results : [];
      return results.map((t: any) => this.normalizeTrack(t));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Jamendo request timed out after 8 seconds');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  public async searchTracks(query: string, limit: number = 20, offset: number = 0): Promise<NormalizedJamendoTrack[]> {
    const cleanedQuery = query.trim();
    if (!cleanedQuery) return [];

    const safeLimit = Math.min(Math.max(1, limit), 50);
    const safeOffset = Math.max(0, offset);
    const cacheKey = `search:${cleanedQuery.toLowerCase()}:${safeLimit}:${safeOffset}`;

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const tracks = await this.fetchFromJamendo({
      search: cleanedQuery,
      limit: safeLimit,
      offset: safeOffset,
    });

    this.setCache(cacheKey, tracks, 300); // 5 min cache
    return tracks;
  }

  public async getFeaturedTracks(limit: number = 20): Promise<NormalizedJamendoTrack[]> {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const cacheKey = `featured:${safeLimit}`;

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const tracks = await this.fetchFromJamendo({
      order: 'popularity_total',
      limit: safeLimit,
      featured: 1,
    });

    this.setCache(cacheKey, tracks, 900); // 15 min cache
    return tracks;
  }

  public async getTrackById(trackId: string): Promise<NormalizedJamendoTrack | null> {
    const cleanedId = trackId.trim();
    if (!cleanedId) return null;

    const cacheKey = `track:${cleanedId}`;
    const cached = this.getCached(cacheKey);
    if (cached && cached.length > 0) return cached[0];

    const tracks = await this.fetchFromJamendo({
      id: cleanedId,
      limit: 1,
    });

    if (tracks.length > 0) {
      this.setCache(cacheKey, [tracks[0]], 1800); // 30 min cache
      return tracks[0];
    }
    return null;
  }
}

export const jamendoService = JamendoService.getInstance();
