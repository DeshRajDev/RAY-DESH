'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Search,
  Download,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  X,
  BookmarkPlus,
  Library,
  Tv,
  Maximize2,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Loader2,
  ListMusic,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Song, YouTubeTrack } from '@/types';
import { musicService, PlayerState } from '@/services/music.service';
import { youtubePlayerManager } from '@/lib/youtube-player';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';

const MUSIC_SECTIONS = [
  'All',
  'Our Songs',
  'Her Favorites',
  'My Favorites',
  'Recently Added',
  'Most Played',
] as const;

const QUICK_DISCOVERY_TAGS = [
  { label: 'Hindi Romantic', query: 'Hindi romantic love songs' },
  { label: 'Bollywood Hits', query: 'Bollywood latest hits' },
  { label: 'Arijit Singh', query: 'Arijit Singh best songs' },
  { label: 'Punjabi Hits', query: 'Punjabi romantic songs' },
  { label: 'Hindi Indie', query: 'Indian indie music acoustic' },
  { label: 'Lo-Fi Romance', query: 'Hindi lo fi chill beats' },
  { label: 'Pahari / Regional', query: 'Himachali Pahari romantic songs' },
  { label: 'Global Hits', query: 'Romantic English acoustic songs' },
];

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function parseApiError(err: unknown, fallbackMessage: string, fallbackCode: string): { code: string; message: string } {
  if (typeof err === 'string') {
    return { code: fallbackCode, message: err };
  }
  if (err && typeof err === 'object') {
    const code = 'code' in err && typeof (err as any).code === 'string' ? (err as any).code : fallbackCode;
    const message = 'message' in err && typeof (err as any).message === 'string' ? (err as any).message : fallbackMessage;
    return { code, message };
  }
  return { code: fallbackCode, message: fallbackMessage };
}

export default function MusicPage() {
  const { user, partner, currentSong, isPlaying, playSong, togglePlay, playNextSong, playPrevSong, triggerHeartEffect } = useApp();

  // Navigation tabs: Sanctuary Playlist vs. YouTube Explorer
  const [activeTab, setActiveTab] = useState<'sanctuary' | 'youtube'>('sanctuary');

  // Sanctuary Songs state
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);

  // YouTube Discovery & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeTracks, setYoutubeTracks] = useState<YouTubeTrack[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<YouTubeTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [youtubeError, setYoutubeError] = useState<{ code: string; message: string } | null>(null);
  const latestRequestId = useRef(0);

  // Player state
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [isPlayerCollapsed, setIsPlayerCollapsed] = useState(false);
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null);

  // Add Track Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newCategory, setNewCategory] = useState<Song['category']>('Our Songs');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newLyrics, setNewLyrics] = useState('');
  const [newNote, setNewNote] = useState('');

  // Save YouTube Track to Sanctuary Modal
  const [trackToSave, setTrackToSave] = useState<YouTubeTrack | null>(null);
  const [saveCategory, setSaveCategory] = useState<Song['category']>('Our Songs');
  const [saveNote, setSaveNote] = useState('');
  const [isSavingTrack, setIsSavingTrack] = useState(false);

  // Subscribe to Unified Player State
  useEffect(() => {
    const unsub = musicService.subscribePlayer((state) => {
      setPlayerState(state);
    });
    return () => unsub();
  }, []);

  // Load Sanctuary Songs
  const loadSanctuarySongs = useCallback(async () => {
    setIsLoadingSongs(true);
    const res = await musicService.getSongs(selectedSection);
    setSongs(res.data ?? []);
    setIsLoadingSongs(false);
  }, [selectedSection]);

  useEffect(() => {
    loadSanctuarySongs();
    const unsubscribe = musicService.subscribe(updated => {
      if (selectedSection === 'All') setSongs(updated);
      else setSongs(updated.filter(s => s.category === selectedSection));
    });
    return () => unsubscribe();
  }, [selectedSection, loadSanctuarySongs]);

  // Load Trending YouTube Music on Tab Switch
  const loadTrendingYouTube = useCallback(async () => {
    setYoutubeError(null);
    const res = await musicService.getTrendingYouTube('IN', 20);
    if (res.success && Array.isArray(res.data)) {
      setTrendingTracks(res.data);
    } else if (res.error) {
      setYoutubeError(parseApiError(res.error, 'Failed to fetch trending music', 'YOUTUBE_TRENDING_FAILED'));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'youtube' && trendingTracks.length === 0 && !youtubeError) {
      loadTrendingYouTube();
    }
  }, [activeTab, trendingTracks.length, youtubeError, loadTrendingYouTube]);

  // Debounced YouTube Search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setYoutubeTracks([]);
      setIsSearching(false);
      return;
    }

    const currentReqId = ++latestRequestId.current;
    setIsSearching(true);
    setYoutubeError(null);

    const timer = setTimeout(async () => {
      const res = await musicService.searchYouTube(trimmed, 24, undefined, 'IN');
      if (currentReqId === latestRequestId.current) {
        setIsSearching(false);
        if (res.success && res.data && Array.isArray(res.data.tracks)) {
          setYoutubeTracks(res.data.tracks);
        } else if (res.error) {
          setYoutubeError(parseApiError(res.error, 'YouTube search failed', 'YOUTUBE_SEARCH_FAILED'));
          setYoutubeTracks([]);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Play YouTube Track directly using unified music service
  const handlePlayYouTubeTrack = (track: YouTubeTrack) => {
    const isFav = musicService.isFavoriteTrack(track.id);
    const virtualSong: Song = {
      id: `youtube_${track.id}`,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      coverUrl: track.coverUrl,
      audioUrl: track.embedUrl,
      addedById: user.id,
      addedByName: 'YouTube Music',
      dateAdded: new Date().toISOString(),
      isFavorite: isFav,
      category: 'Our Songs',
      provider: 'youtube',
      providerTrackId: track.id,
      shareUrl: track.shareUrl,
    };
    playSong(virtualSong);
  };

  // Toggle favorite on ANY track or song with optimistic UI and backend persistence
  const handleToggleFavorite = async (e: React.MouseEvent, trackOrSong: {
    id?: string;
    providerTrackId?: string;
    title: string;
    artist: string;
    coverUrl?: string;
    duration?: number;
    provider?: string;
    shareUrl?: string;
  }) => {
    e.stopPropagation();
    const trackId = trackOrSong.id || trackOrSong.providerTrackId || '';
    setFavoriteLoadingId(trackId);

    try {
      await musicService.toggleFavorite(trackOrSong);
      triggerHeartEffect(e.clientX, e.clientY);
    } catch (err) {
      console.warn('Failed to toggle favorite:', err);
    } finally {
      setFavoriteLoadingId(null);
    }
  };

  // Save YouTube Track to Sanctuary Database
  const handleConfirmSaveToSanctuary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackToSave) return;

    setIsSavingTrack(true);
    await musicService.addYouTubeTrackToSanctuary(
      trackToSave,
      saveCategory,
      saveNote.trim() || undefined,
      user.name || 'Sanctuary',
      user.id
    );
    setIsSavingTrack(false);
    setTrackToSave(null);
    setSaveNote('');
    triggerHeartEffect();
  };

  const handleManualAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim()) return;

    await musicService.addSong({
      title: newTitle.trim(),
      artist: newArtist.trim(),
      duration: 210,
      coverUrl: newCoverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      addedById: user.id,
      addedByName: user.name,
      isFavorite: false,
      category: newCategory,
      lyricsSnippet: newLyrics.trim() || undefined,
      note: newNote.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewArtist('');
    setNewCoverUrl('');
    setNewLyrics('');
    setNewNote('');
    triggerHeartEffect();
  };

  const isTrackSavedInSanctuary = (videoId: string) => {
    return songs.some(s => s.providerTrackId === videoId || s.id === `youtube_${videoId}`);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = pct * (playerState?.duration || currentSong?.duration || 180);
    musicService.seekTo(targetSeconds);
  };

  const currentProgressPercent = (playerState && playerState.duration > 0)
    ? Math.min(100, Math.max(0, (playerState.currentTime / playerState.duration) * 100))
    : 0;

  const isCurrentFavorite = currentSong ? musicService.isFavoriteTrack(currentSong.providerTrackId || currentSong.id) : false;

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 md:px-8 py-5 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <Music className="h-3.5 w-3.5 text-white" />
            <span>Shared Audio &amp; Video Sanctuary</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Music Collection</h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            The soundtrack of our late drives, cooking nights, and sweet moments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="clay-btn clay-btn-primary px-4 py-2 text-xs font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Custom Track
          </button>
        </div>
      </div>

      {/* =========================================================================
          PART 1: FULL-SIZE YOUTUBE-STYLE RESPONSIVE THEATER / CINEMA PLAYER
          ========================================================================= */}
      {currentSong && (
        <div className="rounded-3xl border border-white/10 bg-[#0C0C0C] p-3 sm:p-6 shadow-2xl overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-mono text-[#AAAAAA] uppercase tracking-wider">
                {currentSong.provider === 'youtube' ? 'YouTube Cinema Player' : 'Sanctuary Audio Player'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPlayerCollapsed(!isPlayerCollapsed)}
                className="flex items-center gap-1 text-[11px] font-mono text-[#777777] hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                title={isPlayerCollapsed ? 'Expand Player' : 'Collapse Player'}
              >
                <span>{isPlayerCollapsed ? 'Expand View' : 'Collapse'}</span>
                {isPlayerCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {!isPlayerCollapsed && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: 16:9 Video & Core Controls (8 cols on desktop) */}
              <div className="lg:col-span-8 flex flex-col space-y-4">
                {/* 16:9 YouTube Video Frame */}
                <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl group">
                  {currentSong.provider === 'youtube' ? (
                    <div id="global-youtube-player-frame" className="w-full h-full" />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-[#181818] to-[#0A0A0A]">
                      <img
                        src={currentSong.coverUrl}
                        alt={currentSong.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl"
                      />
                      <div className="relative z-10 text-center space-y-3 p-6">
                        <img
                          src={currentSong.coverUrl}
                          alt={currentSong.title}
                          className="h-32 w-32 rounded-2xl mx-auto object-cover border border-white/20 shadow-2xl"
                        />
                        <h3 className="font-serif text-lg text-white font-normal">{currentSong.title}</h3>
                        <p className="text-xs text-[#888888]">{currentSong.artist}</p>
                      </div>
                    </div>
                  )}

                  {/* Loading Spinner Overlay */}
                  {playerState?.isLoading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none z-10">
                      <div className="flex flex-col items-center gap-2 text-white">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                        <span className="text-xs font-mono text-[#CCCCCC]">Buffering stream...</span>
                      </div>
                    </div>
                  )}

                  {/* Playback Error Overlay */}
                  {playerState?.error && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                      <p className="text-xs text-red-200 max-w-sm">{playerState.error}</p>
                      <button
                        onClick={() => playSong(currentSong)}
                        className="clay-btn clay-btn-secondary px-4 py-1.5 text-xs flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Retry Playback</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress Seeking Bar */}
                <div className="space-y-1.5 pt-1">
                  <div
                    onClick={handleSeek}
                    className="group/seek relative h-3 flex items-center cursor-pointer select-none"
                    title="Click or drag to seek"
                  >
                    <div className="w-full h-1.5 group-hover/seek:h-2.5 bg-white/10 rounded-full overflow-hidden transition-all duration-150">
                      <div
                        className="h-full bg-white transition-all duration-100 rounded-full"
                        style={{ width: `${currentProgressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#777777]">
                    <span>{formatDuration(playerState?.currentTime || 0)}</span>
                    <span>{formatDuration(playerState?.duration || currentSong.duration || 180)}</span>
                  </div>
                </div>

                {/* Title & Metadata Action Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-white/5">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-serif text-lg sm:text-2xl text-white font-medium truncate">
                      {currentSong.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#AAAAAA] font-light truncate">
                      {currentSong.artist}
                      {currentSong.provider === 'youtube' && (
                        <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-600/30">
                          YouTube Music
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Actions: Heart Favorite, Fullscreen, External Link */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleToggleFavorite(e, currentSong)}
                      disabled={favoriteLoadingId === (currentSong.providerTrackId || currentSong.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs ${
                        isCurrentFavorite
                          ? 'bg-red-500/10 border-red-500/40 text-red-400 font-medium'
                          : 'bg-[#181818] border-white/10 text-[#AAAAAA] hover:text-white hover:border-white/20'
                      }`}
                      title={isCurrentFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {favoriteLoadingId === (currentSong.providerTrackId || currentSong.id) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Heart className={`h-3.5 w-3.5 ${isCurrentFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                      )}
                      <span>{isCurrentFavorite ? 'Favorited' : 'Favorite'}</span>
                    </button>

                    {currentSong.provider === 'youtube' && (
                      <button
                        onClick={() => youtubePlayerManager.requestFullscreen()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-[#181818] text-xs text-[#AAAAAA] hover:text-white hover:border-white/20 transition-all"
                        title="Enter official YouTube fullscreen"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Fullscreen</span>
                      </button>
                    )}

                    {currentSong.shareUrl && (
                      <a
                        href={currentSong.shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full border border-white/10 bg-[#181818] text-[#AAAAAA] hover:text-white transition-colors"
                        title="Open in YouTube"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Player Transport Controls */}
                <div className="flex items-center justify-between bg-[#141414] p-3 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => musicService.toggleShuffle()}
                      title={playerState?.isShuffle ? 'Shuffle On' : 'Shuffle Off'}
                      className={`p-2 rounded-full transition-colors ${
                        playerState?.isShuffle ? 'text-white bg-white/15' : 'text-[#666666] hover:text-[#AAAAAA]'
                      }`}
                    >
                      <Shuffle className="h-4 w-4" />
                    </button>

                    <button
                      onClick={playPrevSong}
                      className="p-2 rounded-full text-[#888888] hover:text-white transition-colors"
                      title="Previous Song"
                    >
                      <SkipBack className="h-4 w-4" />
                    </button>

                    <button
                      onClick={togglePlay}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg hover:scale-105 active:scale-95 transition-all"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4 fill-black text-black" />
                      ) : (
                        <Play className="h-4 w-4 fill-black text-black ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={playNextSong}
                      className="p-2 rounded-full text-[#888888] hover:text-white transition-colors"
                      title="Next Song"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => musicService.toggleRepeat()}
                      title={`Repeat Mode: ${playerState?.repeatMode || 'all'}`}
                      className={`p-2 rounded-full transition-colors ${
                        playerState?.repeatMode !== 'off' ? 'text-white bg-white/15' : 'text-[#666666] hover:text-[#AAAAAA]'
                      }`}
                    >
                      {playerState?.repeatMode === 'one' ? (
                        <Repeat1 className="h-4 w-4" />
                      ) : (
                        <Repeat className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => musicService.toggleMute()}
                      className="p-1.5 text-[#888888] hover:text-white transition-colors"
                      title={playerState?.isMuted ? 'Unmute' : 'Mute'}
                    >
                      {playerState?.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={playerState?.isMuted ? 0 : playerState?.volume ?? 0.85}
                      onChange={(e) => musicService.setVolume(parseFloat(e.target.value))}
                      className="w-16 sm:w-24 accent-white h-1 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Up Next / Queue Panel (4 cols on desktop) */}
              <div className="lg:col-span-4 flex flex-col space-y-3 bg-[#111111] p-4 rounded-3xl border border-white/5 h-full max-h-[520px] overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <ListMusic className="h-4 w-4 text-white" />
                    <span className="font-serif text-sm text-white font-medium">Up Next &amp; Queue</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#777777]">{songs.length} tracks</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {songs.map((song, i) => {
                    const isPlayingItem = currentSong.id === song.id;
                    const isItemFav = musicService.isFavoriteTrack(song.providerTrackId || song.id);

                    return (
                      <div
                        key={song.id}
                        onClick={() => playSong(song)}
                        className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                          isPlayingItem
                            ? 'bg-white/10 border border-white/20'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-[#555555] w-4 text-right shrink-0">
                            {i + 1}
                          </span>
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="h-9 w-9 rounded-lg object-cover shrink-0 border border-white/10"
                          />
                          <div className="min-w-0 flex-1">
                            <h5 className={`font-serif text-xs truncate ${isPlayingItem ? 'text-white font-medium' : 'text-[#CCCCCC]'}`}>
                              {song.title}
                            </h5>
                            <p className="text-[10px] text-[#777777] truncate">{song.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 pl-1">
                          <button
                            onClick={(e) => handleToggleFavorite(e, song)}
                            className="p-1 rounded-full text-[#777777] hover:text-white"
                            title="Favorite"
                          >
                            <Heart className={`h-3 w-3 ${isItemFav ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                          {isPlayingItem && (
                            <span className="flex items-center gap-0.5 h-2.5">
                              <span className="w-0.5 h-full bg-white animate-pulse" />
                              <span className="w-0.5 h-1/2 bg-white animate-pulse delay-75" />
                              <span className="w-0.5 h-3/4 bg-white animate-pulse delay-150" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Tab Navigation: Our Sanctuary Playlist vs. YouTube Explorer */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('sanctuary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-mono uppercase transition-all ${
            activeTab === 'sanctuary'
              ? 'bg-white text-black font-medium shadow-md'
              : 'text-[#888888] hover:text-white hover:bg-white/5'
          }`}
        >
          <Library className="h-3.5 w-3.5" />
          <span>Our Sanctuary Playlist ({songs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('youtube')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-mono uppercase transition-all ${
            activeTab === 'youtube'
              ? 'bg-white text-black font-medium shadow-md'
              : 'text-[#888888] hover:text-white hover:bg-white/5'
          }`}
        >
          <Tv className="h-3.5 w-3.5 text-red-500" />
          <span>YouTube Music Explorer</span>
        </button>
      </div>

      {/* TAB 1: SANCTUARY PLAYLIST */}
      {activeTab === 'sanctuary' && (
        <div className="space-y-6">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {MUSIC_SECTIONS.map(sec => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`clay-pill text-xs ${
                  selectedSection === sec ? 'active text-black' : 'text-[#888888] hover:text-white'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Songs Table List */}
          <div className="rounded-3xl border border-white/10 bg-[#0C0C0C] p-4 sm:p-6 shadow-md">
            {isLoadingSongs ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-36 rounded" />
                        <Skeleton className="h-3 w-24 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : songs.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 mx-auto border border-white/10 text-[#666666]">
                  <Music className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg text-white font-normal">No songs in this collection yet</h3>
                  <p className="text-xs text-[#777777] max-w-sm mx-auto">
                    Search Hindi, Punjabi, Bollywood, or romantic music on YouTube to add to our private playlist.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('youtube')}
                  className="clay-btn clay-btn-primary px-5 py-2 text-xs font-medium inline-flex items-center gap-2"
                >
                  <Search className="h-3.5 w-3.5" />
                  Explore YouTube Music
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {songs.map((song, index) => {
                  const isThisPlaying = currentSong?.id === song.id && isPlaying;
                  const isFav = musicService.isFavoriteTrack(song.providerTrackId || song.id);

                  return (
                    <div
                      key={song.id}
                      onClick={() => playSong(song)}
                      className={`group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${
                        currentSong?.id === song.id
                          ? 'bg-white/10 border border-white/20'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-mono text-[#555555] w-5 text-right shrink-0">
                          {index + 1}
                        </span>

                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A]">
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isThisPlaying ? (
                              <Pause className="h-4 w-4 fill-white text-white ml-0.5" />
                            ) : (
                              <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h4
                            className={`font-serif text-sm font-normal line-clamp-1 ${
                              currentSong?.id === song.id ? 'text-white font-medium' : 'text-[#E5E5E5]'
                            }`}
                          >
                            {song.title}
                          </h4>
                          <p className="text-xs text-[#777777] font-light line-clamp-1">
                            {song.artist}
                            {song.provider === 'youtube' && (
                              <span className="ml-1.5 text-[10px] font-mono text-red-400">· YouTube</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <span className="hidden sm:inline text-xs font-mono text-[#666666]">
                          {song.category}
                        </span>

                        {/* Heart icon on song card */}
                        <button
                          onClick={(e) => handleToggleFavorite(e, song)}
                          className="p-2 rounded-full text-[#777777] hover:text-white hover:bg-white/5 transition-colors"
                          title={isFav ? 'Remove favorite' : 'Add to favorites'}
                        >
                          <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: YOUTUBE MUSIC EXPLORER */}
      {activeTab === 'youtube' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Hindi, Bollywood, Punjabi, Arijit Singh, or your favorite song..."
              className="clay-input w-full pl-11 pr-10 h-12 text-sm bg-[#0C0C0C] rounded-2xl border border-white/10 placeholder:text-[#555555]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#666666] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_DISCOVERY_TAGS.map(tag => (
              <button
                key={tag.label}
                onClick={() => setSearchQuery(tag.query)}
                className={`clay-pill text-xs flex items-center gap-1.5 transition-colors ${
                  searchQuery === tag.query ? 'active text-black' : 'text-[#888888] hover:text-white'
                }`}
              >
                <span>{tag.label}</span>
              </button>
            ))}
          </div>

          {/* Error Notice */}
          {youtubeError && (
            <div className="clay-card p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{youtubeError.message}</span>
              </div>
              <button
                onClick={loadTrendingYouTube}
                className="clay-btn clay-btn-secondary px-3 py-1 text-xs flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {isSearching && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4, 6, 7].map(i => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 bg-[#0C0C0C]">
                  <Skeleton className="h-16 w-24 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* Search Results Display with Heart Icon on Every Track Card */}
          {!isSearching && searchQuery.trim() && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#777777]">
                <span>Search results for &ldquo;{searchQuery}&rdquo;</span>
                <span>{youtubeTracks.length} tracks found</span>
              </div>

              {youtubeTracks.length === 0 && !youtubeError ? (
                <div className="clay-card p-8 rounded-3xl text-center space-y-2 border border-white/10 bg-[#0C0C0C]">
                  <p className="font-serif text-base text-white">No tracks found</p>
                  <p className="text-xs text-[#777777]">
                    Try adjusting your keywords or searching by specific artist, singer, movie, or song title.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {youtubeTracks.map(track => {
                    const isPlayingThis =
                      currentSong?.providerTrackId === track.id || currentSong?.id === `youtube_${track.id}`;
                    const isSaved = isTrackSavedInSanctuary(track.id);
                    const isFav = musicService.isFavoriteTrack(track.id);

                    return (
                      <div
                        key={track.id}
                        className="group flex items-center justify-between p-3 rounded-2xl border border-white/10 bg-[#0C0C0C] hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A]">
                            <img
                              src={track.coverUrl}
                              alt={track.title}
                              className="h-full w-full object-cover"
                            />
                            <button
                              onClick={() => handlePlayYouTubeTrack(track)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {isPlayingThis && isPlaying ? (
                                <Pause className="h-5 w-5 fill-white text-white" />
                              ) : (
                                <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                              )}
                            </button>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="font-serif text-sm font-normal text-white line-clamp-1">
                              {track.title}
                            </h4>
                            <p className="text-xs text-[#777777] font-light truncate">{track.artist}</p>
                            <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-[#555555]">
                              <span>{formatDuration(track.duration)}</span>
                              <span className="text-red-400">YouTube</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          {/* Play button */}
                          <button
                            onClick={() => handlePlayYouTubeTrack(track)}
                            title="Play Video"
                            aria-label={`Play ${track.title}`}
                            className="p-2 rounded-full text-[#888888] hover:text-white transition-colors"
                          >
                            {isPlayingThis && isPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>

                          {/* Heart favorite button on YouTube track card */}
                          <button
                            onClick={(e) => handleToggleFavorite(e, {
                              providerTrackId: track.id,
                              title: track.title,
                              artist: track.artist,
                              coverUrl: track.coverUrl,
                              duration: track.duration,
                              provider: 'youtube',
                              shareUrl: track.shareUrl,
                            })}
                            disabled={favoriteLoadingId === track.id}
                            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                            className="p-2 rounded-full text-[#888888] hover:text-white transition-colors"
                          >
                            {favoriteLoadingId === track.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                              <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                            )}
                          </button>

                          {/* Save to sanctuary button */}
                          <button
                            onClick={() => {
                              if (!isSaved) setTrackToSave(track);
                            }}
                            title={isSaved ? 'Already saved in sanctuary' : 'Add to sanctuary playlist'}
                            disabled={isSaved}
                            className={`p-2 rounded-full transition-colors ${
                              isSaved
                                ? 'text-white/40 cursor-default'
                                : 'text-[#888888] hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {isSaved ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <BookmarkPlus className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Trending Music Section when no search active */}
          {!searchQuery.trim() && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg text-white font-normal">Trending Indian Music Videos</h3>
                  <p className="text-xs text-[#777777]">Popular tracks right now in India on YouTube Music</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trendingTracks.map(track => {
                  const isPlayingThis =
                    currentSong?.providerTrackId === track.id || currentSong?.id === `youtube_${track.id}`;
                  const isSaved = isTrackSavedInSanctuary(track.id);
                  const isFav = musicService.isFavoriteTrack(track.id);

                  return (
                    <div
                      key={track.id}
                      className="group flex items-center justify-between p-3 rounded-2xl border border-white/10 bg-[#0C0C0C] hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A]">
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => handlePlayYouTubeTrack(track)}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {isPlayingThis && isPlaying ? (
                              <Pause className="h-5 w-5 fill-white text-white" />
                            ) : (
                              <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif text-sm font-normal text-white line-clamp-1">
                            {track.title}
                          </h4>
                          <p className="text-xs text-[#777777] font-light truncate">{track.artist}</p>
                          <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-[#555555]">
                            <span>{formatDuration(track.duration)}</span>
                            <span className="text-red-400">YouTube</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        {/* Play button */}
                        <button
                          onClick={() => handlePlayYouTubeTrack(track)}
                          title="Play Video"
                          aria-label={`Play ${track.title}`}
                          className="p-2 rounded-full text-[#888888] hover:text-white transition-colors"
                        >
                          {isPlayingThis && isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>

                        {/* Heart favorite button on trending track card */}
                        <button
                          onClick={(e) => handleToggleFavorite(e, {
                            providerTrackId: track.id,
                            title: track.title,
                            artist: track.artist,
                            coverUrl: track.coverUrl,
                            duration: track.duration,
                            provider: 'youtube',
                            shareUrl: track.shareUrl,
                          })}
                          disabled={favoriteLoadingId === track.id}
                          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          className="p-2 rounded-full text-[#888888] hover:text-white transition-colors"
                        >
                          {favoriteLoadingId === track.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          ) : (
                            <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                          )}
                        </button>

                        {/* Save to sanctuary button */}
                        <button
                          onClick={() => {
                            if (!isSaved) setTrackToSave(track);
                          }}
                          title={isSaved ? 'Already saved in sanctuary' : 'Add to sanctuary playlist'}
                          disabled={isSaved}
                          className={`p-2 rounded-full transition-colors ${
                            isSaved
                              ? 'text-white/40 cursor-default'
                              : 'text-[#888888] hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {isSaved ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <BookmarkPlus className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SAVE YOUTUBE TRACK TO SANCTUARY MODAL */}
      <Modal
        isOpen={!!trackToSave}
        onClose={() => setTrackToSave(null)}
        title="Add to Our Sanctuary Playlist"
        description={trackToSave ? `"${trackToSave.title}" by ${trackToSave.artist}` : ''}
      >
        {trackToSave && (
          <form onSubmit={handleConfirmSaveToSanctuary} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
              <img
                src={trackToSave.coverUrl}
                alt={trackToSave.title}
                className="h-12 w-16 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h5 className="font-serif text-sm text-white truncate">{trackToSave.title}</h5>
                <p className="text-xs text-[#777777] truncate">{trackToSave.artist}</p>
                <span className="text-[10px] font-mono text-[#555555]">
                  Duration: {formatDuration(trackToSave.duration)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Playlist Category</label>
              <select
                value={saveCategory}
                onChange={e => setSaveCategory(e.target.value as Song['category'])}
                className="clay-input w-full h-10 px-3 text-xs bg-[#0D0D0D]"
              >
                <option value="Our Songs">Our Songs</option>
                <option value="Her Favorites">Her Favorites</option>
                <option value="My Favorites">My Favorites</option>
                <option value="Recently Added">Recently Added</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Personal Note or Memory (Optional)</label>
              <textarea
                value={saveNote}
                onChange={e => setSaveNote(e.target.value)}
                placeholder="Why this song is special to us..."
                rows={2}
                className="clay-input w-full p-3 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTrackToSave(null)}
                className="clay-btn clay-btn-secondary px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingTrack}
                className="clay-btn clay-btn-primary px-5 py-2 text-xs font-medium"
              >
                {isSavingTrack ? 'Saving...' : 'Save to Our Playlist'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MANUAL ADD CUSTOM TRACK MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Custom Track to Sanctuary"
        description="Save your own special couple song with notes and category."
      >
        <form onSubmit={handleManualAddSong} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Song Title *</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Tum Hi Ho / Perfect"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Artist / Singer *</label>
            <input
              type="text"
              required
              value={newArtist}
              onChange={e => setNewArtist(e.target.value)}
              placeholder="e.g. Arijit Singh / Ed Sheeran"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Category</label>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as Song['category'])}
              className="clay-input w-full h-10 px-3 text-xs bg-[#0D0D0D]"
            >
              <option value="Our Songs">Our Songs</option>
              <option value="Her Favorites">Her Favorites</option>
              <option value="My Favorites">My Favorites</option>
              <option value="Recently Added">Recently Added</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Cover Image URL (Optional)</label>
            <input
              type="url"
              value={newCoverUrl}
              onChange={e => setNewCoverUrl(e.target.value)}
              placeholder="https://..."
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Favorite Lyrics Line (Optional)</label>
            <input
              type="text"
              value={newLyrics}
              onChange={e => setNewLyrics(e.target.value)}
              placeholder="e.g. Kyunki tum hi ho, ab tum hi ho..."
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Special Memory / Note (Optional)</label>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="The song that played on our first rainy drive..."
              rows={2}
              className="clay-input w-full p-3 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="clay-btn clay-btn-secondary px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="clay-btn clay-btn-primary px-5 py-2 text-xs font-medium"
            >
              Add Track
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
