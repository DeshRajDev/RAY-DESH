'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RotateCcw, Heart, Music } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-4 text-[#E5E5E5] select-none">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0C0C0C] p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)] text-center space-y-6">
        {/* Brand Icon Header */}
        <div className="mx-auto relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#222222] to-[#111111] border border-white/20 shadow-lg">
          <img
            src="/icons/ray-logo-cute-web.png"
            alt="Ray"
            className="h-12 w-12 object-contain"
          />
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/90 text-white shadow-md">
            <WifiOff className="h-3 w-3" />
          </div>
        </div>

        {/* Brand & Status Text */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-serif text-[#AAAAAA]">
            <span>Ray</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white tracking-tight">
            Currently Offline
          </h1>

          <p className="text-xs text-[#888888] font-light leading-relaxed max-w-xs mx-auto">
            {isOnline
              ? 'Your connection has been restored! Tap below to re-enter your sanctuary.'
              : 'You are disconnected from the network. Reconnect to send messages, load real-time alerts, and sync memories.'}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleRetry}
            className="clay-btn clay-btn-primary w-full py-3 text-xs font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isOnline ? 'Re-enter Sanctuary' : 'Retry Connection'}</span>
          </button>

          <Link
            href="/music"
            className="clay-btn clay-btn-secondary w-full py-2.5 text-xs font-medium flex items-center justify-center gap-2"
          >
            <Music className="h-3.5 w-3.5" />
            <span>Open Audio Player</span>
          </Link>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-white/5 text-[10px] font-mono text-[#555555]">
          Ray • Progressive Web App Shell Active
        </div>
      </div>
    </div>
  );
}
