'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle, Camera, Music, Calendar, CheckSquare, Compass, BookHeart, Mail, Sparkles, Film, X } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { initialMemories, initialMessages, initialSongs, initialDates, initialBucketList, initialPlaces, initialReels } from '@/constants/initial-data';

export function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, setIsCommandPaletteOpen } = useCommandContextSafe();
  const [searchQuery, setSearchQuery] = useState('');

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

    const q = searchQuery.toLowerCase();
    const matches: { type: string; title: string; subtitle?: string; href: string; icon: any }[] = [];

    // Memories
    initialMemories.forEach(m => {
      if (m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q))) {
        matches.push({ type: 'Memory', title: m.title, subtitle: m.location, href: `/memories`, icon: Camera });
      }
    });

    // Messages
    initialMessages.forEach(msg => {
      if (msg.content.toLowerCase().includes(q)) {
        matches.push({ type: 'Chat Message', title: msg.content, subtitle: msg.createdAt.slice(0, 10), href: '/chat', icon: MessageCircle });
      }
    });

    // Songs
    initialSongs.forEach(s => {
      if (s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || (s.lyricsSnippet && s.lyricsSnippet.toLowerCase().includes(q))) {
        matches.push({ type: 'Music', title: `${s.title} — ${s.artist}`, subtitle: s.category, href: '/music', icon: Music });
      }
    });

    // Dates
    initialDates.forEach(d => {
      if (d.title.toLowerCase().includes(q) || (d.description && d.description.toLowerCase().includes(q))) {
        matches.push({ type: 'Date Event', title: d.title, subtitle: d.type, href: '/dates', icon: Calendar });
      }
    });

    // Bucket list
    initialBucketList.forEach(b => {
      if (b.title.toLowerCase().includes(q) || (b.description && b.description.toLowerCase().includes(q))) {
        matches.push({ type: 'Bucket List', title: b.title, subtitle: b.category, href: '/bucket-list', icon: CheckSquare });
      }
    });

    // Places
    initialPlaces.forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)) {
        matches.push({ type: 'Place', title: `${p.name}, ${p.city}`, subtitle: p.category === 'Been' ? 'Visited' : 'Wishlist', href: '/places', icon: Compass });
      }
    });

    // Reels
    initialReels.forEach(r => {
      if ((r.title && r.title.toLowerCase().includes(q)) || (r.caption && r.caption.toLowerCase().includes(q)) || r.category.toLowerCase().includes(q)) {
        matches.push({ type: 'Reel Video', title: r.title || 'Saved Reel', subtitle: r.caption || r.category, href: '/reels', icon: Film });
      }
    });

    return matches.slice(0, 10);
  }, [searchQuery]);

  const handleSelect = (href: string) => {
    setIsCommandPaletteOpen(false);
    setSearchQuery('');
    router.push(href);
  };

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
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
            className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#0E0E0E] p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)] z-10"
          >
            {/* Search Input */}
            <div className="relative flex items-center border-b border-white/10 pb-3 px-2">
              <Search className="h-4 w-4 text-[#777777] mr-3" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search our memories, songs, chats, places, dates..."
                className="w-full bg-transparent text-sm text-white placeholder-[#555555] focus:outline-none font-light"
              />
              <button
                onClick={() => setIsCommandPaletteOpen(false)}
                className="rounded-lg p-1 text-[#777777] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results */}
            <div className="mt-3 max-h-80 overflow-y-auto space-y-1 p-1">
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
                      className="w-full flex items-center justify-between rounded-xl p-3 text-left hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#181818] border border-white/10 text-[#AAAAAA] group-hover:text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-[#E5E5E5] group-hover:text-white line-clamp-1">
                            {res.title}
                          </div>
                          {res.subtitle && (
                            <div className="text-[11px] text-[#777777] font-light line-clamp-1">
                              {res.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#555555] bg-white/5 px-2 py-0.5 rounded-full">
                        {res.type}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="mt-2 border-t border-white/5 pt-2 px-2 flex items-center justify-between text-[11px] font-mono text-[#555555]">
              <span>Navigate with arrows or click</span>
              <span>ESC to close</span>
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
