'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Heart, X, Shuffle, Repeat, Repeat1, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { useRouter } from 'next/navigation';
import { musicService, PlayerState } from '@/services/music.service';

export function MiniPlayer() {
  const router = useRouter();
  const { currentSong, isPlaying, togglePlay, playNextSong, playPrevSong, triggerHeartEffect, closePlayer } = useApp();
  const [progress, setProgress] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);

  useEffect(() => {
    const unsub = musicService.subscribePlayer((state) => {
      setPlayerState(state);
      if (state.duration > 0) {
        setProgress((state.currentTime / state.duration) * 100);
      }
    });
    return () => unsub();
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = pct * (playerState?.duration || currentSong?.duration || 180);
    musicService.seekTo(targetSeconds);
  };

  return (
    <AnimatePresence>
      {currentSong && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-8 left-4 md:left-auto md:w-96 z-50 pointer-events-auto"
        >
          <div className="relative rounded-3xl border border-white/10 bg-[#0F0F0F]/95 backdrop-blur-xl p-3 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-2">
            {/* Interactive Progress line */}
            <div
              onClick={handleSeek}
              className="group/seek absolute top-0 inset-x-5 h-2.5 -translate-y-1/2 flex items-center cursor-pointer"
              title="Click to seek"
            >
              <div className="w-full h-[2px] group-hover/seek:h-[4px] bg-white/10 overflow-hidden rounded-full transition-all duration-150">
                <div
                  className="h-full bg-white transition-all duration-150"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {/* Song Cover & Info */}
              <div
                onClick={() => router.push('/music')}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-inner bg-[#1A1A1A]">
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className={`h-full w-full object-cover transition-transform duration-500 ${
                      isPlaying ? 'scale-105' : 'scale-100'
                    }`}
                  />
                  {isPlaying && !playerState?.isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 h-full bg-white animate-pulse" />
                        <span className="w-0.5 h-2/3 bg-white animate-pulse delay-75" />
                        <span className="w-0.5 h-4/5 bg-white animate-pulse delay-150" />
                      </div>
                    </div>
                  )}
                  {playerState?.isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h5 className="font-serif text-xs font-normal text-white truncate group-hover:underline">
                      {currentSong.title}
                    </h5>
                    {playerState?.error && (
                      <span title={playerState.error} className="text-red-400 shrink-0">
                        <AlertCircle className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#777777] font-light truncate">
                    {currentSong.artist}
                    {currentSong.provider === 'jamendo' && (
                      <span className="ml-1 text-[9px] font-mono text-[#555555]">· Jamendo</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => musicService.toggleShuffle()}
                  title={playerState?.isShuffle ? 'Shuffle On' : 'Shuffle Off'}
                  aria-label="Toggle Shuffle"
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                    playerState?.isShuffle ? 'text-white bg-white/15' : 'text-[#666666] hover:text-[#AAAAAA]'
                  }`}
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={playPrevSong}
                  aria-label="Previous Track"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#888888] hover:text-white transition-colors"
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  disabled={playerState?.isLoading}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-70"
                >
                  {playerState?.isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                  ) : isPlaying ? (
                    <Pause className="h-3.5 w-3.5 fill-black" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-black ml-0.5" />
                  )}
                </button>

                <button
                  onClick={playNextSong}
                  aria-label="Next Track"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#888888] hover:text-white transition-colors"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => musicService.toggleRepeat()}
                  title={`Repeat: ${playerState?.repeatMode || 'all'}`}
                  aria-label="Toggle Repeat Mode"
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                    playerState?.repeatMode !== 'off' ? 'text-white bg-white/15' : 'text-[#666666] hover:text-[#AAAAAA]'
                  }`}
                >
                  {playerState?.repeatMode === 'one' ? (
                    <Repeat1 className="h-3.5 w-3.5" />
                  ) : (
                    <Repeat className="h-3.5 w-3.5" />
                  )}
                </button>

                <button
                  onClick={() => musicService.toggleMute()}
                  title={playerState?.isMuted ? 'Unmute' : 'Mute'}
                  aria-label="Toggle Mute"
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                    playerState?.isMuted ? 'text-white bg-white/15' : 'text-[#666666] hover:text-[#AAAAAA]'
                  }`}
                >
                  {playerState?.isMuted ? (
                    <VolumeX className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    triggerHeartEffect(e.clientX, e.clientY);
                  }}
                  aria-label="Like Track"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#777777] hover:text-white transition-colors"
                >
                  <Heart className="h-3 w-3" />
                </button>

                <button
                  onClick={closePlayer}
                  aria-label="Close Player"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#555555] hover:text-white hover:bg-white/10 transition-colors ml-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
