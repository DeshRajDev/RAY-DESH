'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Calendar, MapPin, Share2, Tag, Trash2, Camera } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Memory } from '@/types';
import { memoryService } from '@/services/memory.service';
import { formatDate } from '@/lib/date-utils';

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { openMediaViewer, triggerHeartEffect } = useApp();
  const [memory, setMemory] = useState<Memory | null>(null);

  const memoryId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (memoryId) {
      memoryService.getMemoryById(memoryId).then(res => setMemory(res.data ?? null));
    }
  }, [memoryId]);

  if (!memory) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-8 py-12 text-center">
        <p className="text-sm text-[#777777]">Loading memory details...</p>
      </div>
    );
  }

  const handleToggleFavorite = async () => {
    const updated = await memoryService.toggleFavorite(memory.id);
    setMemory(updated.data ?? null);
    triggerHeartEffect();
  };

  const handleDelete = async () => {
    if (confirm('Delete this memory from our vault?')) {
      await memoryService.deleteMemory(memory.id);
      router.push('/memories');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-6 space-y-6">
      {/* Back button */}
      <Link
        href="/memories"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#777777] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Memory Vault
      </Link>

      {/* Main Container */}
      <div className="rounded-3xl border border-white/10 bg-[#0F0F0F] overflow-hidden shadow-xl">
        {/* Cinematic Header Image */}
        <div className="relative h-80 sm:h-96 w-full cursor-pointer bg-black" onClick={() => openMediaViewer(memory.mediaUrls, 0, { title: memory.title, description: memory.description })}>
          <img
            src={memory.coverUrl}
            alt={memory.title}
            className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-black/30" />

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white hover:scale-110 active:scale-95 transition-all"
            >
              <Heart className={`h-5 w-5 ${memory.isFavorite ? 'fill-white text-white' : 'text-[#AAAAAA]'}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[#AAAAAA] hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-10 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-0.5 text-[11px] font-mono text-white">
                {memory.category}
              </span>
              <span className="text-xs font-mono text-[#777777]">
                Preserved on {formatDate(memory.createdAt, 'medium')}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-white font-light">
              {memory.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-[#888888] border-y border-white/5 py-4">
            {memory.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-white" />
                {memory.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-white" />
              {formatDate(memory.date, 'long')}
            </span>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-base text-[#CCCCCC] font-light leading-relaxed whitespace-pre-wrap">
              {memory.description}
            </p>
          </div>

          {/* Tags */}
          {memory.tags && memory.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-4">
              <Tag className="h-3.5 w-3.5 text-[#666666]" />
              {memory.tags.map(tag => (
                <span key={tag} className="text-xs font-mono text-[#777777] bg-white/5 px-2.5 py-1 rounded-lg">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
