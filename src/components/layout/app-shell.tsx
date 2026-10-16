'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { Header } from './header';
import { MiniPlayer } from '@/components/ui/mini-player';
import { NotificationDrawer } from '@/components/ui/notification-drawer';
import { CommandPalette } from '@/components/ui/command-palette';
import { MediaViewer } from '@/components/ui/media-viewer';
import { BirthdayCelebration } from '@/components/ui/birthday-celebration';
import { useApp } from '@/stores/app-context';
import { Heart, Lock } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, floatingHearts } = useApp();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#050505] text-[#E5E5E5]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#151515] border border-white/10">
            <Lock className="h-5 w-5 text-white animate-pulse" />
          </div>
          <p className="font-mono text-xs text-[#777777] uppercase tracking-widest">
            AUTHENTICATING SANCTUARY ACCESS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050505] text-[#E5E5E5] select-none antialiased">
      {/* Left Desktop Sidebar */}
      <Sidebar />

      {/* Main View Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto pb-24 md:pb-12">
          {children}
        </main>

        {/* Persistent Mini Music Player */}
        <MiniPlayer />

        {/* Mobile Navigation */}
        <MobileNav />
      </div>

      {/* Floating Interactive Hearts Overlay */}
      {floatingHearts.map(heart => (
        <div
          key={heart.id}
          style={{ left: `${heart.x}px`, top: `${heart.y}px` }}
          className="pointer-events-none fixed z-50 animate-float-heart"
        >
          <Heart className="h-6 w-6 fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        </div>
      ))}

      {/* Overlays & Modals */}
      <NotificationDrawer />
      <CommandPalette />
      <MediaViewer />
      <BirthdayCelebration />
    </div>
  );
}
