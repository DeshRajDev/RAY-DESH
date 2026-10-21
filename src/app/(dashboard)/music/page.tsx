'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Music,
  Play,
  Pause,
  Heart,
  Search,
  Sparkles,
  Download,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  X,
  Disc3,
  BookmarkPlus,
  Radio,
  Library,
} from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Song, JamendoTrack } from '@/types';
import { musicService, PlayerState } from '@/services/music.service';
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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function MusicPage() {
  const { user, partner, currentSong, isPlaying, playSong, togglePlay, triggerHeartEffect } = useApp();

  // Navigation tabs: Sanctuary Playlist vs. Jamendo Explorer
  const [activeTab, setActiveTab] = useState<'sanctuary' | 'jamendo'>('sanctuary');

  // Sanctuary Songs state
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);

  // Jamendo Discovery & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [jamendoTracks, setJamendoTracks] = useState<JamendoTrack[]>([]);
  const [featuredTracks, setFeaturedTracks] = useState<JamendoTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [jamendoError, setJamendoError] = useState<{ code: string; message: string } | null>(null);
  const latestRequestId = useRef(0);

  // Add Track Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newCategory, setNewCategory] = useState<Song['category']>('Our Songs');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newLyrics, setNewLyrics] = useState('');
  const [newNote, setNewNote] = useState('');

  // Save Jamendo Track to Sanctuary Modal
  const [trackToSave, setTrackToSave] = useState<JamendoTrack | null>(null);
  const [saveCategory, setSaveCategory] = useState<Song['category']>('Our Songs');
  const [saveNote, setSaveNote] = useState('');
  const [isSavingTrack, setIsSavingTrack] = useState(false);

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

  // Load Featured Jamendo Tracks on Mount or Tab switch
  const loadFeaturedJamendo = useCallback(async () => {
    setJamendoError(null);
    const res = await musicService.getFeaturedJamendo(20);
    if (res.success && Array.isArray(res.data)) {
      setFeaturedTracks(res.data);
    } else if (res.error) {
      setJamendoError(parseApiError(res.error, 'Failed to fetch featured Jamendo tracks', 'FEATURED_FAILED'));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'jamendo' && featuredTracks.length === 0 && !jamendoError) {
      loadFeaturedJamendo();
    }
  }, [activeTab, featuredTracks.length, jamendoError, loadFeaturedJamendo]);

  // Debounced Jamendo Search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setJamendoTracks([]);
      setIsSearching(false);
      return;
    }

    const currentReqId = ++latestRequestId.current;
    setIsSearching(true);
    setJamendoError(null);

    const timer = setTimeout(async () => {
      const res = await musicService.searchJamendo(trimmed, 25);
      if (currentReqId === latestRequestId.current) {
        setIsSearching(false);
        if (res.success && Array.isArray(res.data)) {
          setJamendoTracks(res.data);
        } else if (res.error) {
          setJamendoError(parseApiError(res.error, 'Search failed', 'SEARCH_FAILED'));
          setJamendoTracks([]);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Play Jamendo Track directly using unified music player
  const handlePlayJamendoTrack = (track: JamendoTrack) => {
    const virtualSong: Song = {
      id: `jamendo_${track.id}`,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      coverUrl: track.coverUrl,
      audioUrl: track.audioUrl,
      addedById: user.id,
      addedByName: 'Jamendo Music',
      dateAdded: new Date().toISOString(),
      isFavorite: false,
      category: 'Our Songs',
      provider: 'jamendo',
      providerTrackId: track.id,
      licenseUrl: track.licenseUrl,
      shareUrl: track.shareUrl,
    };
    playSong(virtualSong);
  };

  // Save Jamendo Track to Sanctuary Database
  const handleConfirmSaveToSanctuary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackToSave) return;

    setIsSavingTrack(true);
    await musicService.addJamendoTrackToSanctuary(
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

  const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await musicService.toggleFavorite(id);
    triggerHeartEffect();
  };

  const isTrackSavedInSanctuary = (jamendoId: string) => {
    return songs.some(s => s.providerTrackId === jamendoId || s.id === `jamendo_${jamendoId}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <Music className="h-3.5 w-3.5 text-white" />
            <span>Shared Audio Sanctuary</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Music Collection</h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            The soundtrack of our late drives, cooking nights, and sweet moments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="clay-btn clay-btn-primary px-4 py-2.5 text-xs font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Custom Track
          </button>
        </div>
      </div>

      {/* Hero Featured Now Playing Card */}
      {currentSong && (
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#181818] to-[#0A0A0A] p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6 overflow-hidden">
          <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-3xl border border-white/15 shadow-2xl group bg-[#111]">
            <img
              src={currentSong.coverUrl}
              alt={currentSong.title}
              className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
            />
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-black" />
              ) : (
                <Play className="h-5 w-5 fill-black ml-0.5" />
              )}
            </button>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="rounded-full bg-white/10 px-3 py-0.5 text-[10px] font-mono text-white">
                {currentSong.category}
              </span>
              <span className="text-xs font-mono text-[#777777]">
                Added by {currentSong.addedByName}
              </span>
              {currentSong.provider === 'jamendo' && (
                <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-mono text-[#AAAAAA] flex items-center gap-1">
                  <Radio className="h-3 w-3 text-white" />
                  Jamendo Royalty-Free
                </span>
              )}
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal truncate">
              {currentSong.title}
            </h2>
            <p className="text-sm text-[#AAAAAA] font-light truncate">{currentSong.artist}</p>

            {currentSong.note && (
              <p className="text-xs text-[#888888] font-light italic max-w-lg pt-1">
                &ldquo;{currentSong.note}&rdquo;
              </p>
            )}

            {currentSong.licenseUrl && (
              <div className="pt-1">
                <a
                  href={currentSong.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-[#666666] hover:text-[#999999] inline-flex items-center gap-1 transition-colors"
                >
                  <span>Creative Commons License</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Tab Navigation: Our Sanctuary Playlist vs. Jamendo Explorer */}
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
          onClick={() => setActiveTab('jamendo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-mono uppercase transition-all ${
            activeTab === 'jamendo'
              ? 'bg-white text-black font-medium shadow-md'
              : 'text-[#888888] hover:text-white hover:bg-white/5'
          }`}
        >
          <Disc3 className="h-3.5 w-3.5" />
          <span>Jamendo Music Explorer</span>
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
                    Search Jamendo&apos;s library to find romantic melodies or add your own custom favorites.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('jamendo')}
                  className="clay-btn clay-btn-primary px-5 py-2 text-xs font-medium inline-flex items-center gap-2"
                >
                  <Search className="h-3.5 w-3.5" />
                  Explore Jamendo Music
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {songs.map((song, index) => {
                  const isThisPlaying = currentSong?.id === song.id && isPlaying;
                  const isOffline = musicService.isOfflineAvailable(song.id);

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
                            {song.provider === 'jamendo' && (
                              <span className="ml-1 text-[10px] font-mono text-[#555555]">· Jamendo</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <button
                          onClick={async e => {
                            e.stopPropagation();
                            await musicService.saveTrackOffline(song);
                            triggerHeartEffect(e.clientX, e.clientY);
                          }}
                          title={isOffline ? 'Cached for offline playback' : 'Download for offline playback'}
                          className={`p-1.5 rounded-full transition-colors ${
                            isOffline ? 'text-white/90 bg-white/10' : 'text-[#555555] hover:text-[#AAAAAA]'
                          }`}
                        >
                          {isOffline ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <span className="hidden sm:inline text-xs font-mono text-[#666666]">
                          {song.category}
                        </span>

                        <button
                          onClick={e => handleToggleFavorite(e, song.id)}
                          className="p-1.5 rounded-full text-[#777777] hover:text-white"
                        >
                          <Heart className={`h-4 w-4 ${song.isFavorite ? 'fill-white text-white' : ''}`} />
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

      {/* TAB 2: JAMENDO MUSIC EXPLORER */}
      {activeTab === 'jamendo' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Jamendo for tracks, artists, or moods (e.g. acoustic, lo-fi, piano)..."
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

          {/* Jamendo Configuration Error Alert */}
          {jamendoError && jamendoError.code === 'JAMENDO_NOT_CONFIGURED' && (
            <div className="clay-card p-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-amber-300">Jamendo Client ID Required</h4>
                  <p className="text-xs text-[#AAAAAA] leading-relaxed">
                    To enable live music search and streaming from Jamendo, add your free client ID to your backend environment:
                  </p>
                  <pre className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-[#CCCCCC] overflow-x-auto my-2">
                    JAMENDO_CLIENT_ID=your_client_id_here
                  </pre>
                  <p className="text-xs text-[#888888]">
                    Obtain your client ID from{' '}
                    <a
                      href="https://developer.jamendo.com/v3.0/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white underline hover:text-amber-300"
                    >
                      Jamendo Developer Portal
                    </a>
                    .
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={loadFeaturedJamendo}
                  className="clay-btn clay-btn-secondary px-4 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* General Error Notice */}
          {jamendoError && jamendoError.code !== 'JAMENDO_NOT_CONFIGURED' && (
            <div className="clay-card p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{jamendoError.message}</span>
              </div>
              <button
                onClick={loadFeaturedJamendo}
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
                  <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* Search Results Display */}
          {!isSearching && searchQuery.trim() && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#777777]">
                <span>Search results for &ldquo;{searchQuery}&rdquo;</span>
                <span>{jamendoTracks.length} tracks found</span>
              </div>

              {jamendoTracks.length === 0 && !jamendoError ? (
                <div className="clay-card p-8 rounded-3xl text-center space-y-2 border border-white/10 bg-[#0C0C0C]">
                  <p className="font-serif text-base text-white">No tracks found</p>
                  <p className="text-xs text-[#777777]">
                    Try adjusting your keywords or searching by specific artist name, mood, or genre.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {jamendoTracks.map(track => {
                    const isPlayingThis = currentSong?.audioUrl === track.audioUrl && isPlaying;
                    const isSaved = isTrackSavedInSanctuary(track.id);

                    return (
                      <div
                        key={track.id}
                        className="group flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-[#0C0C0C] hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A]">
                            <img
                              src={track.coverUrl}
                              alt={track.title}
                              className="h-full w-full object-cover"
                            />
                            <button
                              onClick={() => handlePlayJamendoTrack(track)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {isPlayingThis ? (
                                <Pause className="h-4 w-4 fill-white text-white" />
                              ) : (
                                <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                              )}
                            </button>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="font-serif text-sm font-normal text-white truncate">
                              {track.title}
                            </h4>
                            <p className="text-xs text-[#777777] font-light truncate">{track.artist}</p>
                            <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-[#555555]">
                              <span>{formatDuration(track.duration)}</span>
                              {track.licenseUrl && (
                                <span className="hover:text-[#888888] truncate">CC License</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <button
                            onClick={() => handlePlayJamendoTrack(track)}
                            title="Play Preview"
                            aria-label={`Play ${track.title}`}
                            className="p-2 rounded-full text-[#888888] hover:text-white transition-colors"
                          >
                            {isPlayingThis ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>

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

          {/* Featured / Trending Jamendo Tracks when not searching */}
          {!searchQuery.trim() && !jamendoError && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-white" />
                  <h3 className="font-serif text-base text-white font-normal">Featured &amp; Trending on Jamendo</h3>
                </div>
                <span className="text-xs font-mono text-[#666666]">Royalty-Free Music</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {featuredTracks.map(track => {
                  const isPlayingThis = currentSong?.audioUrl === track.audioUrl && isPlaying;
                  const isSaved = isTrackSavedInSanctuary(track.id);

                  return (
                    <div
                      key={track.id}
                      className="group flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-[#0C0C0C] hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A]">
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => handlePlayJamendoTrack(track)}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {isPlayingThis ? (
                              <Pause className="h-4 w-4 fill-white text-white" />
                            ) : (
                              <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif text-sm font-normal text-white truncate">
                            {track.title}
                          </h4>
                          <p className="text-xs text-[#777777] font-light truncate">{track.artist}</p>
                          <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-[#555555]">
                            <span>{formatDuration(track.duration)}</span>
                            <span>Jamendo Audio</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <button
                          onClick={() => handlePlayJamendoTrack(track)}
                          title="Play Track"
                          aria-label={`Play ${track.title}`}
                          className="p-2 rounded-full text-[#888888] hover:text-white transition-colors"
                        >
                          {isPlayingThis ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>

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

      {/* SAVE JAMENDO TRACK TO SANCTUARY MODAL */}
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
                className="h-12 w-12 rounded-xl object-cover shrink-0"
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
              <label className="text-xs text-[#AAAAAA]">Personal Note or Story (Optional)</label>
              <textarea
                value={saveNote}
                onChange={e => setSaveNote(e.target.value)}
                placeholder="Why does this track remind you of us..."
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

      {/* MANUAL ADD TRACK MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Custom Song to Sanctuary"
        description="Add an MP3 URL or personal song link to our collection."
      >
        <form onSubmit={handleManualAddSong} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Song Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Mystery of Love"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Artist Name</label>
            <input
              type="text"
              required
              value={newArtist}
              onChange={e => setNewArtist(e.target.value)}
              placeholder="e.g. Sufjan Stevens"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Playlist Category</label>
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
            <label className="text-xs text-[#AAAAAA]">Album Cover URL</label>
            <input
              type="text"
              value={newCoverUrl}
              onChange={e => setNewCoverUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Personal Note / Story</label>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Why this song means something to us..."
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
              Add to Playlist
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
