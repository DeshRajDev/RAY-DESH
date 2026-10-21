'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Search, Heart, Cake } from 'lucide-react';
import { useApp } from '@/stores/app-context';

export function Header() {
  const { 
    user,
    partner, 
    unreadCount, 
    setIsNotificationDrawerOpen, 
    setIsCommandPaletteOpen,
    triggerBirthdayCelebration,
    triggerHeartEffect 
  } = useApp();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#070707]/90 px-3 sm:px-8 backdrop-blur-md select-none">
      {/* Mobile brand & left indicator */}
      <div className="flex items-center gap-2 md:hidden min-w-0">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0 group">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#252525] to-[#121212] border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
            <img
              src="/icons/ray-logo-cute-web.png"
              alt="Ray — किरण"
              className="h-6 w-6 object-contain"
            />
          </div>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-serif text-sm font-medium text-white tracking-wide">Ray</span>
            <span className="text-[10px] text-white/40 font-light">—</span>
            <span className="text-xs font-normal text-white/90 truncate">किरण</span>
          </div>
        </Link>
      </div>

      {/* Desktop breadcrumb showing active logged in user & partner connection status */}
      <div className="hidden md:flex items-center gap-3 text-xs font-mono text-[#888888]">
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
          <span className="text-[10px] uppercase text-[#666666]">Logged in as:</span>
          <span className="text-white font-medium">{user.name}</span>
        </div>
        <span className="text-[#444444]">•</span>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{partner.name} is connected to our sanctuary</span>
        </div>
      </div>

      {/* Right Quick Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Birthday Mode button */}
        <button
          onClick={() => triggerBirthdayCelebration(true)}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#121212] px-3 py-1.5 text-xs text-[#AAAAAA] hover:text-white hover:border-white/20 transition-all"
          title="Birthday Celebration experience"
        >
          <Cake className="h-3.5 w-3.5 text-white" />
          <span className="hidden sm:inline">Birthday</span>
        </button>

        {/* Global Search Button */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#141414] border border-white/10 text-[#AAAAAA] hover:text-white transition-colors"
          title="Search (⌘K)"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Notification Drawer Trigger */}
        <button
          onClick={() => setIsNotificationDrawerOpen(true)}
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#141414] border border-white/10 text-[#AAAAAA] hover:text-white transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-white ring-2 ring-black" />
          )}
        </button>

        {/* Partner avatar */}
        <div
          onClick={(e) => triggerHeartEffect(e.clientX, e.clientY)}
          className="relative cursor-pointer pl-1"
          title={`Tap to send ❤️ to ${partner.name}`}
        >
          <img
            src={partner.avatar}
            alt={partner.name}
            className="h-8 w-8 rounded-full object-cover border border-white/20 shadow-md hover:scale-105 transition-transform"
          />
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-black" />
        </div>
      </div>
    </header>
  );
}
