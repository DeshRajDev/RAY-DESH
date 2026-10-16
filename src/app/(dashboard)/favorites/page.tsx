'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Heart, Music, Camera, MessageCircle, MapPin, Quote, Play } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { initialMemories, initialSongs, initialMessages, initialPlaces } from '@/constants/initial-data';
import { formatDate } from '@/lib/date-utils';
import { EmptyState } from '@/components/ui/modal';

const FAVORITE_TABS = [
  'Favorite Memories',
  'Favorite Songs',
  'Favorite Messages',
  'Favorite Places',
  'Favorite Quotes',
] as const;

type FavoriteTab = typeof FAVORITE_TABS[number];

export default function FavoritesPage() {
  const { user, partner, openMediaViewer, playSong } = useApp();
  const [activeTab, setActiveTab] = useState<FavoriteTab>('Favorite Memories');

  const favoriteMemories = initialMemories.filter(m => m.isFavorite);
  const favoriteSongs = initialSongs.filter(s => s.isFavorite);
  const favoriteMessages = initialMessages.filter(m => m.isPinned || m.reactions.some(r => r.emoji === '❤️'));
  const favoritePlaces = initialPlaces.filter(p => p.isFavorite);

  const favoriteQuotes = [
    { quote: partner.favoriteQuote || 'You are my sun, my moon, and all my stars.', author: partner.name },
    { quote: user.favoriteQuote || 'In all the world, there is no heart for me like yours.', author: user.name },
    { quote: 'Every memory we build here becomes a treasure I replay when I close my eyes.', author: 'Our Sanctuary' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
          <Bookmark className="h-3.5 w-3.5 text-white" />
          <span>Curated Sanctuary</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Favorites</h1>
        <p className="text-xs sm:text-sm text-[#777777] font-light">
          The most treasured memories, songs, words, and places of our relationship
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        {FAVORITE_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`clay-pill ${activeTab === tab ? 'active' : 'text-[#888888] hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {/* 1. Favorite Memories */}
        {activeTab === 'Favorite Memories' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {favoriteMemories.map(mem => (
              <div
                key={mem.id}
                onClick={() => openMediaViewer(mem.mediaUrls, 0, { title: mem.title, description: mem.description })}
                className="clay-card-interactive relative rounded-3xl overflow-hidden cursor-pointer border border-white/10 bg-[#0F0F0F]"
              >
                <div className="relative h-48 w-full bg-black">
                  <img
                    src={mem.coverUrl}
                    alt={mem.title}
                    className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center">
                    <Heart className="h-3.5 w-3.5 fill-white text-white" />
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="font-serif text-base text-white line-clamp-1">{mem.title}</h4>
                  <p className="text-xs text-[#777777] font-light line-clamp-2">{mem.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Favorite Songs */}
        {activeTab === 'Favorite Songs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favoriteSongs.map(song => (
              <div
                key={song.id}
                className="clay-card flex items-center justify-between p-4 border border-white/10 bg-[#0F0F0F]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={song.coverUrl}
                    alt={song.title}
                    className="h-14 w-14 rounded-2xl object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-serif text-sm text-white line-clamp-1">{song.title}</h4>
                    <p className="text-xs text-[#777777] font-light line-clamp-1">{song.artist}</p>
                    {song.note && (
                      <p className="text-[11px] text-[#AAAAAA] italic line-clamp-1 mt-0.5">
                        &ldquo;{song.note}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => playSong(song)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-transform"
                >
                  <Play className="h-4 w-4 fill-black ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. Favorite Messages */}
        {activeTab === 'Favorite Messages' && (
          <div className="space-y-3">
            {favoriteMessages.map(msg => (
              <div
                key={msg.id}
                className="clay-card p-5 rounded-2xl border border-white/10 bg-[#0F0F0F] flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-serif text-white">
                    {msg.senderId === user.id ? user.name : partner.name}
                  </span>
                  <p className="text-xs sm:text-sm text-[#CCCCCC] font-light leading-relaxed">
                    &ldquo;{msg.content}&rdquo;
                  </p>
                  <span className="text-[10px] font-mono text-[#666666]">
                    {formatDate(msg.createdAt, 'medium')}
                  </span>
                </div>
                <Heart className="h-4 w-4 fill-white text-white shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )}

        {/* 4. Favorite Places */}
        {activeTab === 'Favorite Places' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favoritePlaces.map(place => (
              <div
                key={place.id}
                className="clay-card p-5 rounded-2xl border border-white/10 bg-[#0F0F0F] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-white" />
                    <h4 className="font-serif text-base text-white">{place.name}</h4>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded-full text-white">
                    {place.city}, {place.country}
                  </span>
                </div>
                {place.notes && (
                  <p className="text-xs text-[#888888] font-light leading-relaxed">
                    {place.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 5. Favorite Quotes */}
        {activeTab === 'Favorite Quotes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {favoriteQuotes.map((item, idx) => (
              <div
                key={idx}
                className="clay-card p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#0F0F0F] space-y-4 flex flex-col justify-between"
              >
                <Quote className="h-8 w-8 text-white/30" />
                <p className="font-serif text-lg sm:text-xl text-white font-light leading-relaxed italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-[#777777]">
                  <span>— {item.author}</span>
                  <Heart className="h-3.5 w-3.5 fill-white text-white" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
