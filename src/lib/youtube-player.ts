'use client';

// YouTube IFrame Player API TypeScript declarations
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export type YTPlayerStateCode = -1 | 0 | 1 | 2 | 3 | 5;

export interface YouTubePlayerCallbacks {
  onReady?: () => void;
  onStateChange?: (state: YTPlayerStateCode) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onError?: (errorCode: number, message: string) => void;
  onEnded?: () => void;
}

class YouTubePlayerManager {
  private static instance: YouTubePlayerManager;
  private isApiLoaded = false;
  private apiLoadingPromise: Promise<void> | null = null;
  private player: any = null;
  private currentVideoId: string | null = null;
  private timeTicker: NodeJS.Timeout | null = null;
  private callbacks: YouTubePlayerCallbacks = {};
  private currentVolume = 85;
  private isMuted = false;

  private constructor() {}

  public static getInstance(): YouTubePlayerManager {
    if (!YouTubePlayerManager.instance) {
      YouTubePlayerManager.instance = new YouTubePlayerManager();
    }
    return YouTubePlayerManager.instance;
  }

  /**
   * Loads the YouTube IFrame Player API script once
   */
  public loadApi(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();

    if (window.YT && window.YT.Player) {
      this.isApiLoaded = true;
      return Promise.resolve();
    }

    if (this.apiLoadingPromise) {
      return this.apiLoadingPromise;
    }

    this.apiLoadingPromise = new Promise((resolve) => {
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (existingScript) {
        if (window.YT && window.YT.Player) {
          this.isApiLoaded = true;
          resolve();
          return;
        }
      } else {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        document.body.appendChild(tag);
      }

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        this.isApiLoaded = true;
        resolve();
      };

      // Fallback check in case the script loaded before onYouTubeIframeAPIReady was assigned
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          this.isApiLoaded = true;
          resolve();
        }
      }, 100);
    });

    return this.apiLoadingPromise;
  }

  /**
   * Mounts or attaches the YouTube player to a DOM element ID
   */
  public async mountPlayer(
    containerId: string,
    videoId: string,
    callbacks: YouTubePlayerCallbacks = {}
  ): Promise<void> {
    await this.loadApi();
    this.callbacks = callbacks;
    this.currentVideoId = videoId;

    if (typeof window === 'undefined' || !window.YT || !window.YT.Player) {
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    // If player already exists, load the new video directly
    if (this.player && typeof this.player.loadVideoById === 'function') {
      try {
        this.player.loadVideoById(videoId);
        this.player.setVolume(this.currentVolume);
        if (this.isMuted) this.player.mute();
        else this.player.unMute();
        return;
      } catch {
        this.destroy();
      }
    }

    this.destroy();

    // Create fresh player
    this.player = new window.YT.Player(containerId, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        enablejsapi: 1,
        fs: 1,
      },
      events: {
        onReady: (event: any) => {
          try {
            event.target.setVolume(this.currentVolume);
            if (this.isMuted) event.target.mute();
            else event.target.unMute();
            event.target.playVideo();
          } catch {
            // Autoplay restriction fallback
          }
          this.startTimeTracking();
          this.callbacks.onReady?.();
        },
        onStateChange: (event: any) => {
          const state: YTPlayerStateCode = event.data;
          this.callbacks.onStateChange?.(state);

          if (state === 1) {
            // PLAYING
            this.startTimeTracking();
          } else if (state === 2) {
            // PAUSED
            this.stopTimeTracking();
          } else if (state === 0) {
            // ENDED
            this.stopTimeTracking();
            this.callbacks.onEnded?.();
          }
        },
        onError: (event: any) => {
          this.stopTimeTracking();
          const code = event.data;
          let msg = 'Playback error occurred.';
          if (code === 101 || code === 150) {
            msg = 'The owner of this video does not allow embedded playback.';
          } else if (code === 100) {
            msg = 'This video is private or removed.';
          } else if (code === 2) {
            msg = 'Invalid video ID parameter.';
          }
          this.callbacks.onError?.(code, msg);
        },
      },
    });
  }

  public play() {
    if (this.player && typeof this.player.playVideo === 'function') {
      try {
        this.player.playVideo();
      } catch (err) {
        console.warn('YouTube play error:', err);
      }
    }
  }

  public pause() {
    if (this.player && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
      } catch (err) {
        console.warn('YouTube pause error:', err);
      }
    }
  }

  public seekTo(seconds: number) {
    if (this.player && typeof this.player.seekTo === 'function') {
      try {
        this.player.seekTo(seconds, true);
      } catch (err) {
        console.warn('YouTube seek error:', err);
      }
    }
  }

  public setVolume(volume: number) {
    // 0 to 1 converted to 0 to 100 for YouTube
    this.currentVolume = Math.max(0, Math.min(100, Math.round(volume * 100)));
    if (this.player && typeof this.player.setVolume === 'function') {
      try {
        this.player.setVolume(this.currentVolume);
      } catch (err) {
        console.warn('YouTube setVolume error:', err);
      }
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.player) {
      try {
        if (this.isMuted && typeof this.player.mute === 'function') {
          this.player.mute();
        } else if (!this.isMuted && typeof this.player.unMute === 'function') {
          this.player.unMute();
        }
      } catch (err) {
        console.warn('YouTube mute error:', err);
      }
    }
    return this.isMuted;
  }

  public getCurrentTime(): number {
    if (this.player && typeof this.player.getCurrentTime === 'function') {
      try {
        return this.player.getCurrentTime() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  public getDuration(): number {
    if (this.player && typeof this.player.getDuration === 'function') {
      try {
        return this.player.getDuration() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  public requestFullscreen() {
    try {
      const iframe = this.player?.getIframe?.() || document.getElementById('global-youtube-player-frame');
      if (iframe) {
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen();
        } else if ((iframe as any).webkitRequestFullscreen) {
          (iframe as any).webkitRequestFullscreen();
        } else if ((iframe as any).mozRequestFullScreen) {
          (iframe as any).mozRequestFullScreen();
        } else if ((iframe as any).msRequestFullscreen) {
          (iframe as any).msRequestFullscreen();
        }
      }
    } catch (err) {
      console.warn('Failed to trigger fullscreen:', err);
    }
  }

  private startTimeTracking() {
    this.stopTimeTracking();
    this.timeTicker = setInterval(() => {
      if (this.player && typeof this.player.getCurrentTime === 'function') {
        try {
          const currentTime = this.player.getCurrentTime() || 0;
          const duration = this.player.getDuration() || 0;
          this.callbacks.onTimeUpdate?.(currentTime, duration);
        } catch {
          // ignore
        }
      }
    }, 500);
  }

  private stopTimeTracking() {
    if (this.timeTicker) {
      clearInterval(this.timeTicker);
      this.timeTicker = null;
    }
  }

  public destroy() {
    this.stopTimeTracking();
    if (this.player && typeof this.player.destroy === 'function') {
      try {
        this.player.destroy();
      } catch {
        // ignore
      }
    }
    this.player = null;
  }
}

export const youtubePlayerManager = YouTubePlayerManager.getInstance();
