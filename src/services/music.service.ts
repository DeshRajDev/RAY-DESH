import { Song, ApiResponse } from '@/types';
import { initialSongs } from '@/constants/initial-data';

const MUSIC_STORAGE_KEY = 'sanctuary_music_songs_v2';
const OFFLINE_AUDIO_KEY = 'sanctuary_offline_audio_v2';

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
}

class MusicService {
  private songs: Song[] = [];
  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private isShuffle: boolean = false;
  private repeatMode: 'off' | 'all' | 'one' = 'all';
  private offlineTrackIds: Set<string> = new Set();
  private listeners: ((songs: Song[]) => void)[] = [];
  private playerListeners: ((state: PlayerState) => void)[] = [];
  
  // Web Audio Context & Synthesizer for real audible music playback
  private audioCtx: AudioContext | null = null;
  private synthInterval: NodeJS.Timeout | null = null;
  private birthdaySynthInterval: NodeJS.Timeout | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private currentTime: number = 0;
  private timeTicker: NodeJS.Timeout | null = null;

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
          this.songs = JSON.parse(stored);
          return;
        }
      } catch {
        // ignore
      }
    }
    this.songs = [...initialSongs];
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

  // Play a soft romantic lo-fi note
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

  // Start romantic ambient progression for background music
  private startAmbientProgression() {
    this.stopAmbientProgression();
    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C major
      [220.00, 261.63, 329.63, 440.00], // A minor
      [174.61, 220.00, 261.63, 349.23], // F major
      [196.00, 246.94, 293.66, 392.00], // G major
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

  // Birthday "Happy Birthday" melody synthesizer
  public playBirthdayMelody() {
    this.stopBirthdayMelody();
    const melody: { note: number; dur: number }[] = [
      { note: 261.63, dur: 0.4 }, // C4
      { note: 261.63, dur: 0.4 }, // C4
      { note: 293.66, dur: 0.8 }, // D4
      { note: 261.63, dur: 0.8 }, // C4
      { note: 349.23, dur: 0.8 }, // F4
      { note: 329.63, dur: 1.2 }, // E4
      
      { note: 261.63, dur: 0.4 }, // C4
      { note: 261.63, dur: 0.4 }, // C4
      { note: 293.66, dur: 0.8 }, // D4
      { note: 261.63, dur: 0.8 }, // C4
      { note: 392.00, dur: 0.8 }, // G4
      { note: 349.23, dur: 1.2 }, // F4

      { note: 261.63, dur: 0.4 }, // C4
      { note: 261.63, dur: 0.4 }, // C4
      { note: 523.25, dur: 0.8 }, // C5
      { note: 440.00, dur: 0.8 }, // A4
      { note: 349.23, dur: 0.8 }, // F4
      { note: 329.63, dur: 0.8 }, // E4
      { note: 293.66, dur: 1.2 }, // D4

      { note: 466.16, dur: 0.4 }, // Bb4
      { note: 466.16, dur: 0.4 }, // Bb4
      { note: 440.00, dur: 0.8 }, // A4
      { note: 349.23, dur: 0.8 }, // F4
      { note: 392.00, dur: 0.8 }, // G4
      { note: 349.23, dur: 1.6 }, // F4
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

  public async getSongs(category?: string): Promise<ApiResponse<Song[]>> {
    if (category && category !== 'All') {
      return { success: true, data: this.songs.filter(s => s.category === category) };
    }
    return { success: true, data: [...this.songs] };
  }

  public async addSong(payload: Omit<Song, 'id' | 'dateAdded'>): Promise<ApiResponse<Song>> {
    const newSong: Song = {
      ...payload,
      id: `song_${Date.now()}`,
      dateAdded: new Date().toISOString(),
    };
    this.songs.unshift(newSong);
    this.saveSongs();
    this.notify();
    return { success: true, data: newSong };
  }

  public async toggleFavorite(id: string): Promise<ApiResponse<Song>> {
    const s = this.songs.find(item => item.id === id);
    if (!s) throw new Error('Song not found');
    s.isFavorite = !s.isFavorite;
    this.saveSongs();
    this.notify();
    return { success: true, data: { ...s } };
  }

  public playSong(song: Song) {
    this.currentSong = song;
    this.isPlaying = true;
    this.currentTime = 0;

    if (song.audioUrl && typeof window !== 'undefined') {
      if (!this.audioElement) {
        this.audioElement = new Audio();
      }
      this.audioElement.src = song.audioUrl;
      this.audioElement.play().catch(() => {
        // Fallback to ambient progression if custom audio URL blocks
        this.startAmbientProgression();
      });
    } else {
      this.startAmbientProgression();
    }

    this.startTimeTicker();
    this.notifyPlayer();
  }

  public togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      if (this.audioElement && this.currentSong?.audioUrl) {
        this.audioElement.play().catch(() => this.startAmbientProgression());
      } else {
        this.startAmbientProgression();
      }
      this.startTimeTicker();
    } else {
      if (this.audioElement) {
        this.audioElement.pause();
      }
      this.stopAmbientProgression();
      this.stopTimeTicker();
    }
    this.notifyPlayer();
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
      if (this.audioElement) {
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
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    this.stopAmbientProgression();
    this.stopTimeTicker();
    this.notifyPlayer();
  }

  private startTimeTicker() {
    this.stopTimeTicker();
    this.timeTicker = setInterval(() => {
      if (this.isPlaying && this.currentSong) {
        this.currentTime += 1;
        if (this.currentTime >= (this.currentSong.duration || 180)) {
          this.playNext();
        } else {
          this.notifyPlayer();
        }
      }
    }, 1000);
  }

  private stopTimeTicker() {
    if (this.timeTicker) {
      clearInterval(this.timeTicker);
      this.timeTicker = null;
    }
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
      duration: this.currentSong?.duration || 180,
      isShuffle: this.isShuffle,
      repeatMode: this.repeatMode,
    });
    return () => {
      this.playerListeners = this.playerListeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.songs]));
  }

  private notifyPlayer() {
    const dur = this.currentSong?.duration || 180;
    this.playerListeners.forEach(l => l({ 
      currentSong: this.currentSong, 
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: dur,
      isShuffle: this.isShuffle,
      repeatMode: this.repeatMode,
    }));
  }
}

export const musicService = new MusicService();
