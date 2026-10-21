'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  MessageCircle, 
  Flame, 
  Sparkles, 
  Camera, 
  Bookmark, 
  Music, 
  CalendarHeart, 
  Cake, 
  CheckSquare, 
  Compass, 
  MapPin, 
  BookHeart, 
  Mail, 
  History, 
  User, 
  Settings, 
  Search, 
  Sun, 
  Moon, 
  Heart,
  LogOut,
  Film 
} from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { MAIN_NAV_ITEMS } from '@/constants/nav';

const iconMap: Record<string, any> = {
  Home,
  MessageCircle,
  Flame,
  Sparkles,
  Camera,
  Film,
  Bookmark,
  Music,
  CalendarHeart,
  Cake,
  CheckSquare,
  Compass,
  MapPin,
  BookHeart,
  Mail,
  History,
  User,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, partner, theme, toggleTheme, setIsCommandPaletteOpen, triggerHeartEffect } = useApp();

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 flex-col justify-between border-r border-white/10 bg-[#070707] p-5 shrink-0 select-none z-30">
      {/* Top Identity & Quick Search */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#252525] to-[#121212] border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform">
              <img
                src="/icons/ray-logo-cute-web.png"
                alt="Ray"
                className="h-7 w-7 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-tight">
                <h1 className="font-serif text-lg font-light tracking-wide text-white">
                  Ray
                </h1>
              </div>
              <p className="text-[10px] font-mono tracking-widest text-[#777777] uppercase mt-0.5">
                Private Sanctuary
              </p>
            </div>
          </Link>

          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#141414] border border-white/10 text-[#777777] hover:text-white transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Command Search Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-[#101010] px-3.5 py-2.5 text-xs text-[#777777] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] hover:border-white/20 hover:text-[#AAAAAA] transition-all"
        >
          <span className="flex items-center gap-2 font-light">
            <Search className="h-3.5 w-3.5" />
            Search our vault...
          </span>
          <kbd className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] font-mono text-[#666666]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation Links Scrollable Area */}
      <nav className="my-4 flex-1 overflow-y-auto pr-1 space-y-1">
        {MAIN_NAV_ITEMS.map(item => {
          const Icon = iconMap[item.iconName] || Home;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-normal transition-all ${
                isActive
                  ? 'bg-white text-black font-medium shadow-[0_4px_14px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,1)]'
                  : 'text-[#888888] hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-black' : 'text-[#777777]'}`} />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                    isActive
                      ? 'bg-black/20 text-black'
                      : 'bg-white/10 text-[#AAAAAA] border border-white/5'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Partner Status */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        {/* Partner status card */}
        <div
          onClick={(e) => {
            triggerHeartEffect(e.clientX, e.clientY);
          }}
          className="flex items-center justify-between p-2.5 rounded-2xl bg-[#101010] border border-white/10 cursor-pointer hover:border-white/20 transition-all group"
          title={`Click to send ❤️ to ${partner.name}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <img
                src={partner.avatar}
                alt={partner.name}
                className="h-9 w-9 rounded-full object-cover border border-white/20 shadow-md"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-black" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-serif text-white line-clamp-1 group-hover:underline">
                {partner.name} ({partner.nickname})
              </div>
              <p className="text-[10px] text-[#777777] font-light line-clamp-1">
                {partner.statusMessage}
              </p>
            </div>
          </div>
          <Heart className="h-3.5 w-3.5 text-[#555555] group-hover:text-white transition-colors" />
        </div>

        {/* Current user session summary */}
        <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-[#777777] font-mono">
          <div className="flex items-center gap-1.5">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-5 w-5 rounded-full object-cover border border-white/10"
            />
            <span className="text-[#AAAAAA]">Logged in as <strong className="text-white font-normal">{user.name}</strong></span>
          </div>
          <Link href="/profile" className="hover:text-white underline">
            Profile
          </Link>
        </div>
      </div>
    </aside>
  );
}
