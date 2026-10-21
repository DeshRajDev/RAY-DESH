import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface NormalizedYouTubeTrack {
  id: string; // YouTube videoId
  title: string;
  artist: string; // Channel title
  duration: number; // in seconds
  coverUrl: string;
  shareUrl: string;
  embedUrl: string;
  isEmbeddable: boolean;
  publishedAt?: string;
  channelId?: string;
}

export interface YouTubeSearchResult {
  tracks: NormalizedYouTubeTrack[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalResults?: number;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

function parseIsoDuration(durationStr: string): number {
  if (!durationStr) return 0;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function cleanHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export class YouTubeService {
  private static instance: YouTubeService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTimeoutMs = 9000;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  private constructor() {}

  public static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  public isConfigured(): boolean {
    return Boolean(env.YOUTUBE_API_KEY && env.YOUTUBE_API_KEY.trim().length > 0);
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttlSeconds: number = 900) {
    if (this.cache.size > 200) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private checkConfiguration() {
    if (!this.isConfigured()) {
      const err = new Error(
        'YouTube Data API key is not configured on the server. Please set YOUTUBE_API_KEY in your environment.'
      );
      (err as any).code = 'YOUTUBE_NOT_CONFIGURED';
      (err as any).statusCode = 503;
      throw err;
    }
  }

  private async fetchGoogleApi<T>(endpoint: string, params: Record<string, string | number>): Promise<T> {
    this.checkConfiguration();

    const apiKey = env.YOUTUBE_API_KEY!.trim();
    const searchParams = new URLSearchParams({
      key: apiKey,
    });

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, String(v));
      }
    });

    const url = `${this.baseUrl}/${endpoint}?${searchParams.toString()}`;

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

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorDetail = json?.error?.errors?.[0];
        const reason = errorDetail?.reason || json?.error?.status || 'UNKNOWN';
        const message = json?.error?.message || `YouTube API request failed with status ${response.status}`;

        logger.warn({ reason, message, status: response.status }, 'YouTube API error response');

        const err = new Error(message);
        if (reason === 'quotaExceeded' || response.status === 403) {
          (err as any).code = 'YOUTUBE_QUOTA_EXCEEDED';
          (err as any).statusCode = 429;
        } else if (response.status === 400 || reason === 'keyInvalid') {
          (err as any).code = 'YOUTUBE_INVALID_KEY';
          (err as any).statusCode = 400;
        } else {
          (err as any).code = 'YOUTUBE_API_ERROR';
          (err as any).statusCode = response.status;
        }
        throw err;
      }

      return json as T;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        const timeoutErr = new Error('YouTube API request timed out after 9 seconds');
        (timeoutErr as any).code = 'YOUTUBE_TIMEOUT';
        (timeoutErr as any).statusCode = 504;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Enriches video IDs with details from videos.list (duration, embeddability)
   */
  public async enrichVideoDetails(videoIds: string[]): Promise<Map<string, { duration: number; isEmbeddable: boolean }>> {
    const detailsMap = new Map<string, { duration: number; isEmbeddable: boolean }>();
    if (videoIds.length === 0) return detailsMap;

    try {
      const json: any = await this.fetchGoogleApi('videos', {
        part: 'contentDetails,status',
        id: videoIds.slice(0, 50).join(','),
      });

      if (Array.isArray(json?.items)) {
        json.items.forEach((item: any) => {
          const duration = parseIsoDuration(item?.contentDetails?.duration || '');
          const isEmbeddable = item?.status?.embeddable !== false;
          detailsMap.set(item.id, { duration, isEmbeddable });
        });
      }
    } catch (err) {
      logger.warn({ err }, 'Failed to enrich video durations, using defaults');
    }

    return detailsMap;
  }

  /**
   * Search YouTube for music videos
   */
  public async searchVideos(
    query: string,
    limit: number = 20,
    pageToken?: string,
    regionCode: string = 'IN'
  ): Promise<YouTubeSearchResult> {
    const cleanedQuery = query.trim();
    if (!cleanedQuery) {
      return { tracks: [] };
    }

    const safeLimit = Math.min(Math.max(1, limit), 50);
    const cacheKey = `search:${cleanedQuery.toLowerCase()}:${safeLimit}:${pageToken || ''}:${regionCode}`;

    const cached = this.getCached<YouTubeSearchResult>(cacheKey);
    if (cached) return cached;

    // Search request
    const searchJson: any = await this.fetchGoogleApi('search', {
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10', // Music
      regionCode,
      q: cleanedQuery,
      maxResults: safeLimit,
      pageToken: pageToken || '',
      safeSearch: 'moderate',
    });

    const items = Array.isArray(searchJson?.items) ? searchJson.items : [];
    const videoIds = items.map((it: any) => it.id?.videoId).filter(Boolean);

    // Fetch accurate durations and embeddable status
    const detailsMap = await this.enrichVideoDetails(videoIds);

    const tracks: NormalizedYouTubeTrack[] = items
      .filter((it: any) => Boolean(it.id?.videoId))
      .map((it: any) => {
        const vid = it.id.videoId;
        const details = detailsMap.get(vid);
        const snippet = it.snippet || {};
        const thumbnails = snippet.thumbnails || {};
        const coverUrl =
          thumbnails.high?.url ||
          thumbnails.medium?.url ||
          thumbnails.default?.url ||
          `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;

        return {
          id: vid,
          title: cleanHtmlEntities(snippet.title || 'Untitled Video'),
          artist: cleanHtmlEntities(snippet.channelTitle || 'YouTube Artist'),
          duration: details?.duration || 210,
          coverUrl,
          shareUrl: `https://www.youtube.com/watch?v=${vid}`,
          embedUrl: `https://www.youtube.com/embed/${vid}`,
          isEmbeddable: details ? details.isEmbeddable : true,
          publishedAt: snippet.publishedAt,
          channelId: snippet.channelId,
        };
      });

    const result: YouTubeSearchResult = {
      tracks,
      nextPageToken: searchJson.nextPageToken,
      prevPageToken: searchJson.prevPageToken,
      totalResults: searchJson.pageInfo?.totalResults,
    };

    // Cache successful search results for 15 minutes
    this.setCache(cacheKey, result, 900);
    return result;
  }

  /**
   * Get trending music in India (or specified region)
   */
  public async getTrendingMusic(regionCode: string = 'IN', limit: number = 20): Promise<NormalizedYouTubeTrack[]> {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const cacheKey = `trending:${regionCode}:${safeLimit}`;

    const cached = this.getCached<NormalizedYouTubeTrack[]>(cacheKey);
    if (cached) return cached;

    const json: any = await this.fetchGoogleApi('videos', {
      part: 'snippet,contentDetails,status',
      chart: 'mostPopular',
      videoCategoryId: '10', // Music
      regionCode,
      maxResults: safeLimit,
    });

    const items = Array.isArray(json?.items) ? json.items : [];

    const tracks: NormalizedYouTubeTrack[] = items.map((it: any) => {
      const vid = it.id;
      const snippet = it.snippet || {};
      const thumbnails = snippet.thumbnails || {};
      const coverUrl =
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url ||
        `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
      const duration = parseIsoDuration(it.contentDetails?.duration || '');

      return {
        id: vid,
        title: cleanHtmlEntities(snippet.title || 'Untitled Video'),
        artist: cleanHtmlEntities(snippet.channelTitle || 'YouTube Artist'),
        duration: duration || 210,
        coverUrl,
        shareUrl: `https://www.youtube.com/watch?v=${vid}`,
        embedUrl: `https://www.youtube.com/embed/${vid}`,
        isEmbeddable: it.status?.embeddable !== false,
        publishedAt: snippet.publishedAt,
        channelId: snippet.channelId,
      };
    });

    // Cache trending tracks for 30 minutes
    this.setCache(cacheKey, tracks, 1800);
    return tracks;
  }

  /**
   * Get single video details by YouTube ID
   */
  public async getVideoDetails(videoId: string): Promise<NormalizedYouTubeTrack | null> {
    const cleanedId = videoId.trim();
    if (!cleanedId) return null;

    const cacheKey = `video:${cleanedId}`;
    const cached = this.getCached<NormalizedYouTubeTrack>(cacheKey);
    if (cached) return cached;

    const json: any = await this.fetchGoogleApi('videos', {
      part: 'snippet,contentDetails,status',
      id: cleanedId,
    });

    const item = json?.items?.[0];
    if (!item) return null;

    const snippet = item.snippet || {};
    const thumbnails = snippet.thumbnails || {};
    const coverUrl =
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      `https://img.youtube.com/vi/${cleanedId}/hqdefault.jpg`;
    const duration = parseIsoDuration(item.contentDetails?.duration || '');

    const track: NormalizedYouTubeTrack = {
      id: cleanedId,
      title: cleanHtmlEntities(snippet.title || 'Untitled Video'),
      artist: cleanHtmlEntities(snippet.channelTitle || 'YouTube Artist'),
      duration: duration || 210,
      coverUrl,
      shareUrl: `https://www.youtube.com/watch?v=${cleanedId}`,
      embedUrl: `https://www.youtube.com/embed/${cleanedId}`,
      isEmbeddable: item.status?.embeddable !== false,
      publishedAt: snippet.publishedAt,
      channelId: snippet.channelId,
    };

    this.setCache(cacheKey, track, 3600); // 1 hour cache
    return track;
  }
}

export const youtubeService = YouTubeService.getInstance();
