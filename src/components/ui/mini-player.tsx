'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Heart, X, Shuffle, Repeat, Repeat1 } from 'lucide-react';
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
            {/* Progress line */}
            <div className="absolute top-0 inset-x-5 h-[2px] bg-white/10 overflow-hidden rounded-full">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {/* Song Cover & Info */}
              <div
                onClick={() => router.push('/music')}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-inner">
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className={`h-full w-full object-cover transition-transform duration-500 ${
                      isPlaying ? 'scale-105' : 'scale-100'
                    }`}
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 h-full bg-white animate-pulse" />
                        <span className="w-0.5 h-2/3 bg-white animate-pulse delay-75" />
                        <span className="w-0.5 h-4/5 bg-white animate-pulse delay-150" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h5 className="font-serif text-xs font-normal text-white truncate group-hover:underline">
                    {currentSong.title}
                  </h5>
                  <p className="text-[11px] text-[#777777] font-light truncate">
                    {currentSong.artist}
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
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-md hover:scale-105 active:scale-95 transition-all"
                >
                  {isPlaying ? (
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
