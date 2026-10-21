import { Song, YouTubeTrack, YouTubeSearchResult, ApiResponse } from '@/types';
import { initialSongs } from '@/constants/initial-data';
import { ApiClient } from './api/client';
import { youtubePlayerManager, YTPlayerStateCode } from '@/lib/youtube-player';

const MUSIC_STORAGE_KEY = 'sanctuary_music_songs_v4';
const OFFLINE_AUDIO_KEY = 'sanctuary_offline_audio_v2';

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isLoading: boolean;
  error: string | null;
  volume: number;
  isMuted: boolean;
}

class MusicService {
  private songs: Song[] = [];
  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private isShuffle: boolean = false;
  private repeatMode: 'off' | 'all' | 'one' = 'all';
  private isLoading: boolean = false;
  private error: string | null = null;
  private volume: number = 0.85;
  private isMuted: boolean = false;
  private offlineTrackIds: Set<string> = new Set();
  private listeners: ((songs: Song[]) => void)[] = [];
  private playerListeners: ((state: PlayerState) => void)[] = [];

  // Web Audio Context & Synthesizer fallback
  private audioCtx: AudioContext | null = null;
  private synthInterval: NodeJS.Timeout | null = null;
  private birthdaySynthInterval: NodeJS.Timeout | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private currentTime: number = 0;
  private duration: number = 180;
  private boundAudioListeners: { [key: string]: EventListener } = {};

  constructor() {
    this.loadSongs();
    this.loadOfflineTracks();
  }

  private loadOfflineTracks() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(OFFLINE_AUDIO_KEY);
        if (stored) {
          this.offlineTrackIds = new Set(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
    }
  }

  private saveOfflineTracks() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(OFFLINE_AUDIO_KEY, JSON.stringify(Array.from(this.offlineTrackIds)));
      } catch {
        // ignore
      }
    }
  }

  private loadSongs() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(MUSIC_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.songs = parsed;
            return;
          }
        }
      } catch {
        // ignore
      }
    }
    this.songs = [...initialSongs];
    this.saveSongs();
  }

  private saveSongs() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(this.songs));
      } catch {
        // ignore
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private playRomanticTone(freq: number, type: OscillatorType = 'sine', duration: number = 1.2, volume: number = 0.08) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context error fallback
    }
  }

  private startAmbientProgression() {
    this.stopAmbientProgression();
    const chords = [
      [261.63, 329.63, 392.00, 523.25],
      [220.00, 261.63, 329.63, 440.00],
      [174.61, 220.00, 261.63, 349.23],
      [196.00, 246.94, 293.66, 392.00],
    ];
    let chordIdx = 0;
    let noteIdx = 0;

    this.synthInterval = setInterval(() => {
      if (!this.isPlaying) return;
      const currentChord = chords[chordIdx];
      const freq = currentChord[noteIdx % currentChord.length];
      this.playRomanticTone(freq, 'triangle', 1.8, 0.04);

      noteIdx++;
      if (noteIdx >= 4) {
        noteIdx = 0;
        chordIdx = (chordIdx + 1) % chords.length;
      }
    }, 600);
  }

  private stopAmbientProgression() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public playBirthdayMelody() {
    this.stopBirthdayMelody();
    const melody: { note: number; dur: number }[] = [
      { note: 261.63, dur: 0.4 },
      { note: 261.63, dur: 0.4 },
      { note: 293.66, dur: 0.8 },
      { note: 261.63, dur: 0.8 },
      { note: 349.23, dur: 0.8 },
      { note: 329.63, dur: 1.2 },
      { note: 261.63, dur: 0.4 },
      { note: 261.63, dur: 0.4 },
      { note: 293.66, dur: 0.8 },
      { note: 261.63, dur: 0.8 },
      { note: 392.00, dur: 0.8 },
      { note: 349.23, dur: 1.2 },
      { note: 261.63, dur: 0.4 },
      { note: 261.63, dur: 0.4 },
      { note: 523.25, dur: 0.8 },
      { note: 440.00, dur: 0.8 },
      { note: 349.23, dur: 0.8 },
      { note: 329.63, dur: 0.8 },
      { note: 293.66, dur: 1.2 },
      { note: 466.16, dur: 0.4 },
      { note: 466.16, dur: 0.4 },
      { note: 440.00, dur: 0.8 },
      { note: 349.23, dur: 0.8 },
      { note: 392.00, dur: 0.8 },
      { note: 349.23, dur: 1.6 },
    ];

    let notePointer = 0;
    const playNext = () => {
      if (notePointer >= melody.length) {
        notePointer = 0;
      }
      const item = melody[notePointer];
      this.playRomanticTone(item.note, 'sine', item.dur + 0.2, 0.12);
      notePointer++;
      this.birthdaySynthInterval = setTimeout(playNext, item.dur * 800);
    };

    playNext();
  }

  public stopBirthdayMelody() {
    if (this.birthdaySynthInterval) {
      clearTimeout(this.birthdaySynthInterval);
      this.birthdaySynthInterval = null;
    }
  }

  // --- Audio Element Handlers for non-YouTube tracks ---
  private setupAudioElement() {
    if (typeof window === 'undefined') return;
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
    }

    this.removeAudioListeners();

    const onTimeUpdate = () => {
      if (this.audioElement && this.currentSong?.provider !== 'youtube') {
        this.currentTime = this.audioElement.currentTime;
        this.notifyPlayer();
      }
    };

    const onLoadedMetadata = () => {
      if (this.audioElement && this.currentSong?.provider !== 'youtube') {
        if (!isNaN(this.audioElement.duration)) {
          this.duration = this.audioElement.duration;
        } else if (this.currentSong?.duration) {
          this.duration = this.currentSong.duration;
        }
        this.notifyPlayer();
      }
    };

    const onWaiting = () => {
      if (this.currentSong?.provider !== 'youtube') {
        this.isLoading = true;
        this.notifyPlayer();
      }
    };

    const onPlaying = () => {
      if (this.currentSong?.provider !== 'youtube') {
        this.isLoading = false;
        this.isPlaying = true;
        this.error = null;
        this.notifyPlayer();
      }
    };

    const onCanPlay = () => {
      if (this.currentSong?.provider !== 'youtube') {
        this.isLoading = false;
        this.notifyPlayer();
      }
    };

    const onEnded = () => {
      if (this.currentSong?.provider !== 'youtube') {
        this.playNext();
      }
    };

    const onError = () => {
      if (this.currentSong?.provider !== 'youtube') {
        this.isLoading = false;
        this.isPlaying = false;
        this.error = 'Streaming playback failed for this audio track.';
        this.notifyPlayer();
      }
    };

    this.boundAudioListeners = {
      timeupdate: onTimeUpdate as EventListener,
      loadedmetadata: onLoadedMetadata as EventListener,
      waiting: onWaiting as EventListener,
      playing: onPlaying as EventListener,
      canplay: onCanPlay as EventListener,
      ended: onEnded as EventListener,
      error: onError as EventListener,
    };

    Object.entries(this.boundAudioListeners).forEach(([evt, handler]) => {
      this.audioElement?.addEventListener(evt, handler);
    });
  }

  private removeAudioListeners() {
    if (this.audioElement && this.boundAudioListeners) {
      Object.entries(this.boundAudioListeners).forEach(([evt, handler]) => {
        this.audioElement?.removeEventListener(evt, handler);
      });
      this.boundAudioListeners = {};
    }
  }

  private updateMediaSession(song: Song) {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist,
          album: song.album || 'Ray Sanctuary',
          artwork: [
            { src: song.coverUrl, sizes: '512x512', type: 'image/jpeg' },
          ],
        });

        navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrevious());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            this.seekTo(details.seekTime);
          }
        });
      } catch {
        // media session fallback
      }
    }
  }

  // --- Sanctuary Songs API ---
  public async getSongs(category?: string): Promise<ApiResponse<Song[]>> {
    try {
      if (typeof window !== 'undefined') {
        const res = await ApiClient.getInstance().get<{ success: boolean; data: any[] }>('/music');
        if (res && res.success && Array.isArray(res.data)) {
          const formatted: Song[] = res.data.map(item => ({
            id: item.id || item._id,
            title: item.title,
            artist: item.artist,
            album: item.album || '',
            duration: item.duration || 180,
            coverUrl: item.coverUrl,
            audioUrl: item.audioUrl,
            addedById: item.addedById,
            addedByName: item.addedByName || 'Sanctuary',
            dateAdded: item.createdAt || new Date().toISOString(),
            isFavorite: !!item.isFavorite,
            category: (item.category as Song['category']) || 'Our Songs',
            lyricsSnippet: item.lyricsSnippet,
            note: item.note,
            provider: item.provider,
            providerTrackId: item.providerTrackId,
            licenseUrl: item.licenseUrl,
            shareUrl: item.shareUrl,
          }));
          this.songs = formatted;
          this.saveSongs();
        }
      }
    } catch {
      // Fallback to local songs
    }

    if (category && category !== 'All') {
      return { success: true, data: this.songs.filter(s => s.category === category) };
    }
    return { success: true, data: [...this.songs] };
  }

  public async addSong(payload: Omit<Song, 'id' | 'dateAdded'>): Promise<ApiResponse<Song>> {
    try {
      const res = await ApiClient.post<ApiResponse<any>>('/music', payload);
      if (res && res.success && res.data) {
        const item = res.data;
        const newSong: Song = {
          id: item.id || item._id || `song_${Date.now()}`,
          title: item.title,
          artist: item.artist,
          album: item.album || '',
          duration: item.duration || 180,
          coverUrl: item.coverUrl,
          audioUrl: item.audioUrl,
          addedById: item.addedById,
          addedByName: item.addedByName || 'Sanctuary',
          dateAdded: item.createdAt || new Date().toISOString(),
          isFavorite: !!item.isFavorite,
          category: (item.category as Song['category']) || payload.category,
          lyricsSnippet: item.lyricsSnippet,
          note: item.note,
          provider: item.provider,
          providerTrackId: item.providerTrackId,
          licenseUrl: item.licenseUrl,
          shareUrl: item.shareUrl,
        };
        this.songs.unshift(newSong);
        this.saveSongs();
        this.notify();
        return { success: true, data: newSong };
      }
    } catch (err) {
      console.warn('[MusicService] Failed to add song via backend:', err);
    }

    const fallbackSong: Song = {
      ...payload,
      id: `song_${Date.now()}`,
      dateAdded: new Date().toISOString(),
    };
    this.songs.unshift(fallbackSong);
    this.saveSongs();
    this.notify();
    return { success: true, data: fallbackSong };
  }

  public isFavoriteTrack(idOrVideoId?: string): boolean {
    if (!idOrVideoId) return false;
    return this.songs.some(
      (s) =>
        (s.id === idOrVideoId || s.providerTrackId === idOrVideoId || s.id === `youtube_${idOrVideoId}`) &&
        s.isFavorite
    );
  }

  public async getFavoriteSongs(): Promise<ApiResponse<Song[]>> {
    try {
      const res = await ApiClient.get<ApiResponse<any[]>>('/music/favorites');
      if (res && res.success && Array.isArray(res.data)) {
        const formatted: Song[] = res.data.map((item) => ({
          id: item.id || item._id,
          title: item.title,
          artist: item.artist,
          album: item.album || '',
          duration: item.duration || 180,
          coverUrl: item.coverUrl,
          audioUrl: item.audioUrl,
          addedById: item.addedById,
          addedByName: item.addedByName || 'Sanctuary',
          dateAdded: item.createdAt || new Date().toISOString(),
          isFavorite: true,
          category: (item.category as Song['category']) || 'Our Songs',
          lyricsSnippet: item.lyricsSnippet,
          note: item.note,
          provider: item.provider,
          providerTrackId: item.providerTrackId,
          licenseUrl: item.licenseUrl,
          shareUrl: item.shareUrl,
        }));
        return { success: true, data: formatted };
      }
    } catch (err) {
      console.warn('[MusicService] Failed to load favorites from backend:', err);
    }
    return { success: true, data: this.songs.filter((s) => s.isFavorite) };
  }

  public async toggleFavorite(
    trackOrId:
      | string
      | {
          id?: string;
          providerTrackId?: string;
          title?: string;
          artist?: string;
          coverUrl?: string;
          duration?: number;
          provider?: string;
          shareUrl?: string;
        }
  ): Promise<ApiResponse<Song>> {
    const payload =
      typeof trackOrId === 'string'
        ? { songId: trackOrId }
        : {
            songId: trackOrId.id?.startsWith('youtube_') ? undefined : trackOrId.id,
            providerTrackId: trackOrId.providerTrackId || (trackOrId.id?.startsWith('youtube_') ? trackOrId.id.replace('youtube_', '') : undefined),
            title: trackOrId.title,
            artist: trackOrId.artist,
            coverUrl: trackOrId.coverUrl,
            duration: trackOrId.duration,
            provider: trackOrId.provider || 'youtube',
            shareUrl: trackOrId.shareUrl,
          };

    try {
      const res = await ApiClient.post<ApiResponse<any>>('/music/favorite-toggle', payload);
      if (res && res.success && res.data) {
        const serverSong = res.data;
        const normalizedSong: Song = {
          id: serverSong.id || serverSong._id,
          title: serverSong.title,
          artist: serverSong.artist,
          album: serverSong.album || '',
          duration: serverSong.duration || 180,
          coverUrl: serverSong.coverUrl,
          audioUrl: serverSong.audioUrl,
          addedById: serverSong.addedById,
          addedByName: serverSong.addedByName || 'Sanctuary',
          dateAdded: serverSong.createdAt || new Date().toISOString(),
          isFavorite: !!serverSong.isFavorite,
          category: (serverSong.category as Song['category']) || 'Our Songs',
          lyricsSnippet: serverSong.lyricsSnippet,
          note: serverSong.note,
          provider: serverSong.provider,
          providerTrackId: serverSong.providerTrackId,
          licenseUrl: serverSong.licenseUrl,
          shareUrl: serverSong.shareUrl,
        };

        const existingIdx = this.songs.findIndex(
          (s) =>
            s.id === normalizedSong.id ||
            (normalizedSong.providerTrackId && s.providerTrackId === normalizedSong.providerTrackId) ||
            s.id === `youtube_${normalizedSong.providerTrackId}`
        );

        if (existingIdx > -1) {
          this.songs[existingIdx] = normalizedSong;
        } else {
          this.songs.unshift(normalizedSong);
        }

        if (
          this.currentSong &&
          (this.currentSong.id === normalizedSong.id ||
            (normalizedSong.providerTrackId && this.currentSong.providerTrackId === normalizedSong.providerTrackId) ||
            this.currentSong.id === `youtube_${normalizedSong.providerTrackId}`)
        ) {
          this.currentSong.isFavorite = normalizedSong.isFavorite;
        }

        this.saveSongs();
        this.notify();
        this.notifyPlayer();
        return { success: true, data: normalizedSong };
      }
    } catch (err) {
      console.warn('[MusicService] Backend toggle favorite failed, falling back locally:', err);
    }

    const songId = typeof trackOrId === 'string' ? trackOrId : trackOrId.id;
    const s = this.songs.find((item) => item.id === songId);
    if (s) {
      s.isFavorite = !s.isFavorite;
      if (this.currentSong && this.currentSong.id === s.id) {
        this.currentSong.isFavorite = s.isFavorite;
      }
      this.saveSongs();
      this.notify();
      this.notifyPlayer();
      return { success: true, data: { ...s } };
    }

    throw new Error('Track could not be favorited');
  }

  public async deleteSong(id: string): Promise<ApiResponse<boolean>> {
    try {
      await ApiClient.delete(`/music/${id}`);
    } catch (err) {
      console.warn('[MusicService] Failed to delete song on backend:', err);
    }
    this.songs = this.songs.filter((s) => s.id !== id);
    this.saveSongs();
    this.notify();
    return { success: true, data: true };
  }

  // --- YouTube Music API Integration ---
  public async searchYouTube(
    query: string,
    limit: number = 20,
    pageToken?: string,
    regionCode: string = 'IN'
  ): Promise<ApiResponse<YouTubeSearchResult>> {
    try {
      const qs = new URLSearchParams({
        q: query.trim(),
        limit: String(limit),
        regionCode,
        ...(pageToken ? { pageToken } : {}),
      });

      const res = await ApiClient.get<ApiResponse<YouTubeSearchResult>>(`/music/search?${qs.toString()}`);
      return res;
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err?.data?.error?.code || 'YOUTUBE_SEARCH_FAILED',
          message: err?.message || 'Failed to search YouTube videos',
        },
        data: { tracks: [] },
      };
    }
  }

  public async getTrendingYouTube(regionCode: string = 'IN', limit: number = 20): Promise<ApiResponse<YouTubeTrack[]>> {
    try {
      const res = await ApiClient.get<ApiResponse<YouTubeTrack[]>>(`/music/trending?regionCode=${regionCode}&limit=${limit}`);
      return res;
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err?.data?.error?.code || 'YOUTUBE_TRENDING_FAILED',
          message: err?.message || 'Failed to fetch trending YouTube music',
        },
        data: [],
      };
    }
  }

  public async getYouTubeVideoDetails(videoId: string): Promise<ApiResponse<YouTubeTrack | null>> {
    try {
      const res = await ApiClient.get<ApiResponse<YouTubeTrack>>(`/music/videos/${videoId}`);
      return res;
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'YOUTUBE_VIDEO_FAILED',
          message: err?.message || 'Failed to load video details from YouTube',
        },
        data: null,
      };
    }
  }

  public async addYouTubeTrackToSanctuary(
    track: YouTubeTrack,
    category: Song['category'] = 'Our Songs',
    note?: string,
    userName: string = 'Sanctuary',
    userId: string = ''
  ): Promise<ApiResponse<Song>> {
    return this.addSong({
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl,
      audioUrl: track.embedUrl,
      duration: track.duration,
      addedById: userId,
      addedByName: userName,
      isFavorite: false,
      category,
      note,
      provider: 'youtube',
      providerTrackId: track.id,
      shareUrl: track.shareUrl,
    });
  }

  // --- Unified Playback Controls (YouTube + Audio) ---
  public playSong(song: Song) {
    this.currentSong = song;
    this.isPlaying = true;
    this.currentTime = 0;
    this.duration = song.duration || 180;
    this.error = null;
    this.isLoading = true;

    this.stopAmbientProgression();

    if (song.provider === 'youtube' && song.providerTrackId) {
      // Pause any running HTMLAudioElement
      if (this.audioElement) {
        this.audioElement.pause();
      }

      const videoId = song.providerTrackId;
      youtubePlayerManager.mountPlayer('global-youtube-player-frame', videoId, {
        onReady: () => {
          this.isLoading = false;
          this.isPlaying = true;
          this.notifyPlayer();
        },
        onStateChange: (state: YTPlayerStateCode) => {
          if (state === 1) {
            // PLAYING
            this.isPlaying = true;
            this.isLoading = false;
            this.error = null;
          } else if (state === 2) {
            // PAUSED
            this.isPlaying = false;
          } else if (state === 3) {
            // BUFFERING
            this.isLoading = true;
          }
          this.notifyPlayer();
        },
        onTimeUpdate: (cur, dur) => {
          this.currentTime = cur;
          if (dur > 0) this.duration = dur;
          this.notifyPlayer();
        },
        onError: (_code, msg) => {
          this.isLoading = false;
          this.isPlaying = false;
          this.error = msg;
          this.notifyPlayer();
        },
        onEnded: () => {
          this.playNext();
        },
      });
    } else if (song.audioUrl && typeof window !== 'undefined') {
      // Pause YouTube player if mounted
      youtubePlayerManager.pause();

      this.setupAudioElement();
      if (this.audioElement) {
        this.audioElement.src = song.audioUrl;
        this.audioElement.volume = this.volume;
        this.audioElement.muted = this.isMuted;
        this.audioElement.play().catch((err: unknown) => {
          console.warn('[MusicService] Autoplay prevented or stream blocked:', err);
          this.isLoading = false;
          this.startAmbientProgression();
        });
      }
    } else {
      this.startAmbientProgression();
      this.isLoading = false;
    }

    this.updateMediaSession(song);
    this.recordPlayCount(song.id);
    this.notifyPlayer();
  }

  private async recordPlayCount(id: string) {
    try {
      await ApiClient.post(`/music/${id}/play`);
    } catch {
      // ignore
    }
  }

  public togglePlay() {
    this.isPlaying = !this.isPlaying;
    this.error = null;

    if (this.currentSong?.provider === 'youtube') {
      if (this.isPlaying) {
        youtubePlayerManager.play();
      } else {
        youtubePlayerManager.pause();
      }
    } else {
      if (this.isPlaying) {
        if (this.audioElement && this.currentSong?.audioUrl) {
          this.audioElement.play().catch(() => this.startAmbientProgression());
        } else {
          this.startAmbientProgression();
        }
      } else {
        if (this.audioElement) {
          this.audioElement.pause();
        }
        this.stopAmbientProgression();
      }
    }
    this.notifyPlayer();
  }

  public seekTo(seconds: number) {
    const clamped = Math.max(0, Math.min(seconds, this.duration || 180));
    this.currentTime = clamped;

    if (this.currentSong?.provider === 'youtube') {
      youtubePlayerManager.seekTo(clamped);
    } else if (this.audioElement && this.currentSong?.audioUrl) {
      this.audioElement.currentTime = clamped;
    }
    this.notifyPlayer();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));

    youtubePlayerManager.setVolume(this.volume);

    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (this.volume > 0 && this.isMuted) {
      this.isMuted = false;
      if (this.audioElement) this.audioElement.muted = false;
    }
    this.notifyPlayer();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    youtubePlayerManager.toggleMute();

    if (this.audioElement) {
      this.audioElement.muted = this.isMuted;
    }
    this.notifyPlayer();
    return this.isMuted;
  }

  public toggleShuffle(): boolean {
    this.isShuffle = !this.isShuffle;
    this.notifyPlayer();
    return this.isShuffle;
  }

  public toggleRepeat(): 'off' | 'all' | 'one' {
    if (this.repeatMode === 'off') this.repeatMode = 'all';
    else if (this.repeatMode === 'all') this.repeatMode = 'one';
    else this.repeatMode = 'off';
    this.notifyPlayer();
    return this.repeatMode;
  }

  public getShuffle(): boolean {
    return this.isShuffle;
  }

  public getRepeatMode(): 'off' | 'all' | 'one' {
    return this.repeatMode;
  }

  public isOfflineAvailable(songId: string): boolean {
    return this.offlineTrackIds.has(songId);
  }

  public async saveTrackOffline(song: Song): Promise<boolean> {
    if (song.provider === 'youtube') {
      // As per YouTube ToS, offline video downloading/caching is strictly disallowed.
      return false;
    }

    if (!song.audioUrl) {
      this.offlineTrackIds.add(song.id);
      this.saveOfflineTracks();
      this.notify();
      return true;
    }

    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cache = await caches.open('ray-offline-audio');
        await cache.add(song.audioUrl);
      }
      this.offlineTrackIds.add(song.id);
      this.saveOfflineTracks();
      this.notify();
      return true;
    } catch (err) {
      console.warn('[MusicService] Failed to cache audio offline:', err);
      return false;
    }
  }

  public playNext() {
    if (!this.currentSong || this.songs.length === 0) return;

    if (this.repeatMode === 'one') {
      this.currentTime = 0;
      if (this.currentSong.provider === 'youtube') {
        youtubePlayerManager.seekTo(0);
        youtubePlayerManager.play();
      } else if (this.audioElement) {
        this.audioElement.currentTime = 0;
        this.audioElement.play().catch(() => {});
      }
      this.notifyPlayer();
      return;
    }

    const currentIndex = this.songs.findIndex(s => s.id === this.currentSong?.id);

    if (this.isShuffle && this.songs.length > 1) {
      let randomIndex = currentIndex;
      while (randomIndex === currentIndex) {
        randomIndex = Math.floor(Math.random() * this.songs.length);
      }
      this.playSong(this.songs[randomIndex]);
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= this.songs.length) {
      if (this.repeatMode === 'off') {
        this.closePlayer();
        return;
      }
      this.playSong(this.songs[0]);
    } else {
      this.playSong(this.songs[nextIndex]);
    }
  }

  public playPrevious() {
    if (!this.currentSong || this.songs.length === 0) return;
    const currentIndex = this.songs.findIndex(s => s.id === this.currentSong?.id);
    const prevIndex = (currentIndex - 1 + this.songs.length) % this.songs.length;
    this.playSong(this.songs[prevIndex]);
  }

  public closePlayer() {
    this.isPlaying = false;
    this.currentSong = null;
    this.currentTime = 0;
    this.error = null;
    this.isLoading = false;

    youtubePlayerManager.pause();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.removeAudioListeners();
    }
    this.stopAmbientProgression();
    this.notifyPlayer();
  }

  public subscribe(listener: (songs: Song[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public subscribePlayer(listener: (state: PlayerState) => void) {
    this.playerListeners.push(listener);
    listener({ 
      currentSong: this.currentSong, 
      isPlaying: this.isPlaying, 
      currentTime: this.currentTime,
      duration: this.duration,
      isShuffle: this.isShuffle,
      repeatMode: this.repeatMode,
      isLoading: this.isLoading,
      error: this.error,
      volume: this.volume,
      isMuted: this.isMuted,
    });
    return () => {
      this.playerListeners = this.playerListeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.songs]));
  }

  private notifyPlayer() {
    this.playerListeners.forEach(l => l({ 
      currentSong: this.currentSong, 
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      isShuffle: this.isShuffle,
      repeatMode: this.repeatMode,
      isLoading: this.isLoading,
      error: this.error,
      volume: this.volume,
      isMuted: this.isMuted,
    }));
  }
}

export const musicService = new MusicService();
