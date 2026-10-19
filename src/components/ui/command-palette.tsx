'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle, Camera, Music, Calendar, CheckSquare, Compass, BookHeart, Mail, Sparkles, Film, X } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { ApiClient } from '@/services/api/client';

export function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, setIsCommandPaletteOpen } = useCommandContextSafe();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; subtitle?: string; href: string; icon: any }[]>([]);

  // Close with Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await ApiClient.get<{
          success: boolean;
          data: {
            messages: any[];
            memories: any[];
            songs: any[];
            journal: any[];
            letters: any[];
            bucketList: any[];
          };
        }>(`/search?q=${encodeURIComponent(searchQuery.trim())}`);

        if (res && res.data) {
          const matches: { type: string; title: string; subtitle?: string; href: string; icon: any }[] = [];

          (res.data.memories || []).forEach((m: any) => {
            matches.push({ type: 'Memory', title: m.title, subtitle: m.location, href: '/memories', icon: Camera });
          });
          (res.data.messages || []).forEach((msg: any) => {
            matches.push({ type: 'Chat Message', title: msg.content, subtitle: msg.createdAt?.slice(0, 10), href: '/chat', icon: MessageCircle });
          });
          (res.data.songs || []).forEach((s: any) => {
            matches.push({ type: 'Music', title: `${s.title} — ${s.artist}`, subtitle: s.category, href: '/music', icon: Music });
          });
          (res.data.letters || []).forEach((l: any) => {
            matches.push({ type: 'Love Letter', title: l.occasion || l.title, subtitle: `From ${l.authorName}`, href: '/letters', icon: Mail });
          });
          (res.data.bucketList || []).forEach((b: any) => {
            matches.push({ type: 'Bucket List', title: b.title, subtitle: b.category, href: '/bucket-list', icon: CheckSquare });
          });
          (res.data.journal || []).forEach((j: any) => {
            matches.push({ type: 'Journal', title: j.title, subtitle: j.mood, href: '/journal', icon: BookHeart });
          });

          setSearchResults(matches.slice(0, 10));
        }
      } catch {
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search filtered results
  const results = useMemo(() => {
    if (!searchQuery.trim()) {
      return [
        { type: 'Quick Navigation', title: 'Home Dashboard', href: '/dashboard', icon: Sparkles },
        { type: 'Quick Navigation', title: 'Private WhatsApp Chat', href: '/chat', icon: MessageCircle },
        { type: 'Quick Navigation', title: 'Our Reels Gallery', href: '/reels', icon: Film },
        { type: 'Quick Navigation', title: 'Memory Vault & Photos', href: '/memories', icon: Camera },
        { type: 'Quick Navigation', title: 'Our Shared Music', href: '/music', icon: Music },
        { type: 'Quick Navigation', title: 'Our Bucket List', href: '/bucket-list', icon: CheckSquare },
        { type: 'Quick Navigation', title: 'Special Dates Calendar', href: '/dates', icon: Calendar },
        { type: 'Quick Navigation', title: 'Digital Letters & Notes', href: '/letters', icon: Mail },
        { type: 'Quick Navigation', title: 'Relationship Journal', href: '/journal', icon: BookHeart },
      ];
    }
    return searchResults;
  }, [searchQuery, searchResults]);

  const handleSelect = (href: string) => {
    setIsCommandPaletteOpen(false);
    setSearchQuery('');
    router.push(href);
  };

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCommandPaletteOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#0E0E0E] p-3 sm:p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)] z-10"
          >
            {/* Search Input */}
            <div className="relative flex items-center border-b border-white/10 pb-3 px-2">
              <Search className="h-4 w-4 text-[#777777] mr-3 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search memories, songs, chats, places, dates..."
                className="w-full min-w-0 bg-transparent text-xs sm:text-sm text-white placeholder-[#555555] focus:outline-none font-light"
              />
              <button
                onClick={() => setIsCommandPaletteOpen(false)}
                className="rounded-lg p-1 text-[#777777] hover:text-white shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results */}
            <div className="mt-3 max-h-[60vh] sm:max-h-80 overflow-y-auto space-y-1 p-1">
              {results.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#666666] font-light">
                  No memories or items found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                results.map((res, i) => {
                  const Icon = res.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(res.href)}
                      className="w-full flex items-center justify-between gap-2 rounded-xl p-2.5 sm:p-3 text-left hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#181818] border border-white/10 text-[#AAAAAA] group-hover:text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-medium text-[#E5E5E5] group-hover:text-white truncate">
                            {res.title}
                          </div>
                          {res.subtitle && (
                            <div className="text-[11px] text-[#777777] font-light truncate">
                              {res.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-[#555555] bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                        {res.type}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="mt-2 border-t border-white/5 pt-2 px-2 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-[#555555]">
              <span>Navigate or tap to select</span>
              <span>ESC / tap outside</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function useCommandContextSafe() {
  return useApp();
}
