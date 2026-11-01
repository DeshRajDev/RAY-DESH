'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Plus,
  Heart,
  ExternalLink,
  Trash2,
  Edit3,
  Search,
  ShieldCheck,
  Calendar,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Smartphone,
  Images,
} from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Reel, ReelCategory, MediaAsset } from '@/types';
import { reelsService } from '@/services/reels.service';
import { ExternalVideoEmbed } from '@/components/reels/ExternalVideoEmbed';
import { Modal, EmptyState } from '@/components/ui/modal';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import { formatDate } from '@/lib/date-utils';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All', value: 'All' },
  { label: 'Romantic', value: 'romantic' },
  { label: 'Memories', value: 'memories' },
  { label: 'Favorites', value: 'favorites' },
  { label: 'Recently Added', value: 'recently_added' },
];

export default function ReelsPage() {
  const { triggerHeartEffect } = useApp();
  const [reels, setReels] = useState<Reel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Feed View & Autoplay states
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');
  const [activeReelIndex, setActiveReelIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeReel, setActiveReel] = useState<Reel | null>(null);

  const handleSelectFromLibrary = async (selectedAssets: MediaAsset[]) => {
    for (const asset of selectedAssets) {
      try {
        await reelsService.addReel({
          url: asset.url,
          title: asset.title || 'Sanctuary Reel',
          caption: asset.caption || '',
          category: 'romantic',
          isFavorite: asset.isFavorite,
        });
      } catch (err) {
        console.warn('Reel already in list or error:', err);
      }
    }
    const res = await reelsService.getReels(selectedCategory);
    if (res && res.data) setReels(res.data);
    triggerHeartEffect();
  };

  // Add Form State
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newCategory, setNewCategory] = useState('romantic');
  const [newIsFavorite, setNewIsFavorite] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editCategory, setEditCategory] = useState('romantic');
  const [editIsFavorite, setEditIsFavorite] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    reelsService.getReels(selectedCategory).then((res) => {
      if (res && res.data) {
        setReels(res.data);
      }
      setIsLoading(false);
    });

    const unsubscribe = reelsService.subscribe((updated) => {
      if (selectedCategory === 'All') {
        setReels(updated);
      } else if (selectedCategory === 'favorites') {
        setReels(updated.filter((r) => r.isFavorite));
      } else if (selectedCategory === 'recently_added') {
        setReels([...updated].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
      } else {
        setReels(updated.filter((r) => r.category.toLowerCase() === selectedCategory.toLowerCase()));
      }
    });

    return () => unsubscribe();
  }, [selectedCategory]);

  // Filtered Reels by Search Query
  const displayedReels = useMemo(() => {
    if (!searchQuery.trim()) return reels;
    const q = searchQuery.toLowerCase();
    return reels.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.caption?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.platform?.toLowerCase().includes(q)
    );
  }, [reels, searchQuery]);

  const totalCount = reels.length;
  const favoritesCount = reels.filter((r) => r.isFavorite).length;

  // IntersectionObserver to auto-play only visible reel and pause others
  useEffect(() => {
    if (viewMode !== 'feed' || displayedReels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const indexStr = entry.target.getAttribute('data-index');
            if (indexStr !== null) {
              const idx = parseInt(indexStr, 10);
              if (!isNaN(idx)) {
                setActiveReelIndex(idx);
              }
            }
          }
        });
      },
      {
        root: feedContainerRef.current,
        threshold: 0.6,
      }
    );

    const cards = feedContainerRef.current?.querySelectorAll('.reel-feed-card');
    cards?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [viewMode, displayedReels]);

  const scrollToReel = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= displayedReels.length) return;
    const el = feedContainerRef.current?.querySelector(`[data-index="${targetIdx}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveReelIndex(targetIdx);
    }
  };

  // Add Reel Handler
  const handleAddReel = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    const trimmedUrl = newUrl.trim();
    if (!trimmedUrl) {
      setAddError('Please enter a video URL');
      return;
    }

    if (!trimmedUrl.startsWith('https://')) {
      setAddError('URL must use secure HTTPS (e.g. https://www.instagram.com/reel/...)');
      return;
    }

    const isInstagram = trimmedUrl.includes('instagram.com');
    const isFacebook = trimmedUrl.includes('facebook.com') || trimmedUrl.includes('fb.watch');

    if (!isInstagram && !isFacebook) {
      setAddError('Only official Instagram Reels/Posts and Facebook video URLs are supported.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reelsService.addReel({
        url: trimmedUrl,
        title: newTitle.trim() || undefined,
        caption: newCaption.trim() || undefined,
        category: newCategory,
        isFavorite: newIsFavorite,
      });

      setAddSuccess('Reel saved to our gallery!');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setNewUrl('');
        setNewTitle('');
        setNewCaption('');
        setNewCategory('romantic');
        setNewIsFavorite(false);
        setAddSuccess(null);
        setAddError(null);
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add reel';
      setAddError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await reelsService.toggleFavorite(id);
      triggerHeartEffect(e.clientX, e.clientY);
    } catch (err) {
      console.error('Failed to favorite reel:', err);
    }
  };

  // Open Edit Modal
  const openEditModal = (reel: Reel) => {
    setActiveReel(reel);
    setEditTitle(reel.title || '');
    setEditCaption(reel.caption || '');
    setEditCategory(reel.category || 'romantic');
    setEditIsFavorite(Boolean(reel.isFavorite));
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReel) return;

    try {
      await reelsService.updateReel(activeReel.id, {
        title: editTitle.trim(),
        caption: editCaption.trim(),
        category: editCategory,
        isFavorite: editIsFavorite,
      });
      setIsEditModalOpen(false);
      setActiveReel(null);
    } catch (err) {
      console.error('Failed to update reel:', err);
    }
  };

  // Open Delete Confirmation Modal
  const openDeleteModal = (reel: Reel) => {
    setActiveReel(reel);
    setIsDeleteModalOpen(true);
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!activeReel) return;
    try {
      await reelsService.deleteReel(activeReel.id);
      setIsDeleteModalOpen(false);
      setActiveReel(null);
    } catch (err) {
      console.error('Failed to delete reel:', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8 select-none">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#777777]">
            <Film className="h-3.5 w-3.5 text-white" />
            <span>Shared Video Vault</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-white tracking-tight">
            Our Reels
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] font-light max-w-xl leading-relaxed">
            Little videos, big memories. A collection of moments we want to keep.
          </p>
        </div>

        {/* Action Button & Statistics */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#121212] border border-white/10">
            <button
              onClick={() => setViewMode('feed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                viewMode === 'feed'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Feed</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#121212] border border-white/10 text-xs text-[#888888] font-mono">
            <span>{totalCount} Saved</span>
            <span className="text-white/20">•</span>
            <span className="text-white">{favoritesCount} Favorites</span>
          </div>

          <button
            onClick={() => setIsMediaPickerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#161616] border border-white/10 text-xs text-[#CCCCCC] hover:text-white hover:border-white/30 transition-all"
            title="Pick video from Our Media Library"
          >
            <Images className="h-4 w-4" />
            <span className="hidden sm:inline">From Library</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black text-xs font-medium shadow-[0_4px_16px_rgba(255,255,255,0.25),inset_0_1px_1px_rgba(255,255,255,1)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Reel</span>
          </button>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-2xl text-xs font-normal whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-black font-medium shadow-[0_4px_12px_rgba(255,255,255,0.2)]'
                    : 'bg-[#121212] border border-white/5 text-[#777777] hover:text-white hover:border-white/15'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved reels..."
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#101010] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/25 transition-all"
          />
        </div>
      </div>

      {/* 3. Reels Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-[#0F0F0F] border border-white/5 p-4 space-y-4 animate-pulse"
            >
              <div className="w-full aspect-[9/16] rounded-2xl bg-[#181818]" />
              <div className="h-4 bg-[#181818] rounded w-3/4" />
              <div className="h-3 bg-[#181818] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : displayedReels.length === 0 ? (
        <EmptyState
          icon={<Film className="h-8 w-8 text-[#777777]" />}
          title="No Reels in this Category"
          description="Save romantic Instagram Reels and Facebook videos so we can watch them together anytime."
          actionText="Save a Reel"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : viewMode === 'feed' ? (
        /* IMMERSIVE VERTICAL REEL FEED WITH AUTOPLAY */
        <div className="relative max-w-sm sm:max-w-md mx-auto">
          {/* Header indicator & sound toggle */}
          <div className="flex items-center justify-between pb-3 px-1 text-xs text-[#888888]">
            <span className="font-mono">
              Reel {activeReelIndex + 1} of {displayedReels.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all text-xs"
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                <span>{isMuted ? 'Muted' : 'Sound On'}</span>
              </button>
            </div>
          </div>

          {/* Vertical Snap Scroll Feed */}
          <div
            ref={feedContainerRef}
            className="h-[calc(100vh-14rem)] overflow-y-auto snap-y snap-mandatory rounded-3xl space-y-6 scrollbar-none pr-1"
          >
            {displayedReels.map((reel, idx) => {
              const isCurrent = idx === activeReelIndex;
              const isNext = idx === activeReelIndex + 1;
              const isInstagram = reel.platform === 'instagram';

              return (
                <div
                  key={reel.id}
                  data-index={idx}
                  className="reel-feed-card snap-center shrink-0 w-full min-h-[580px] rounded-3xl bg-[#101010] border border-white/15 overflow-hidden p-3.5 shadow-2xl flex flex-col justify-between"
                >
                  {/* Embedded Player with Autoplay on Active View */}
                  <div className="w-full">
                    <ExternalVideoEmbed
                      url={reel.url}
                      platform={reel.platform}
                      shortcode={reel.shortcode}
                      title={reel.title}
                      isActive={isCurrent}
                      autoLoad={isCurrent || isNext}
                      isMuted={isMuted}
                      onToggleMute={() => setIsMuted(prev => !prev)}
                    />
                  </div>

                  {/* Metadata & Actions Overlay */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider text-[#AAAAAA] bg-white/5 border border-white/10">
                          {isInstagram ? 'Instagram' : 'Facebook'}
                        </span>
                        <span className="text-[10px] font-mono text-[#777777] capitalize">
                          {reel.category}
                        </span>
                      </div>
                      <h3 className="font-serif text-sm text-white font-medium line-clamp-1">
                        {reel.title || 'Untitled Reel'}
                      </h3>
                      {reel.caption && (
                        <p className="text-xs text-[#888888] line-clamp-1 font-light">
                          {reel.caption}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => handleToggleFavorite(e, reel.id)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                          reel.isFavorite
                            ? 'bg-white text-black border-white shadow-md'
                            : 'bg-[#181818] border-white/10 text-[#777777] hover:text-white'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${reel.isFavorite ? 'fill-black text-black' : ''}`} />
                      </button>
                      <a
                        href={reel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#181818] border border-white/10 text-[#AAAAAA] hover:text-white transition-all"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop/Tablet Floating Up/Down Navigation Buttons */}
          <div className="hidden md:flex flex-col gap-2 absolute -right-14 top-1/2 -translate-y-1/2">
            <button
              onClick={() => scrollToReel(activeReelIndex - 1)}
              disabled={activeReelIndex === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#161616] border border-white/15 text-white disabled:opacity-30 hover:bg-white hover:text-black transition-all shadow-md"
              title="Previous reel"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollToReel(activeReelIndex + 1)}
              disabled={activeReelIndex >= displayedReels.length - 1}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#161616] border border-white/15 text-white disabled:opacity-30 hover:bg-white hover:text-black transition-all shadow-md"
              title="Next reel"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedReels.map((reel) => {
            const isInstagram = reel.platform === 'instagram';
            return (
              <motion.div
                key={reel.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="group relative flex flex-col justify-between rounded-3xl bg-[#101010] border border-white/10 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-white/20 transition-all"
              >
                {/* Embedded Video Player */}
                <div className="w-full mb-4">
                  <ExternalVideoEmbed
                    url={reel.url}
                    platform={reel.platform}
                    shortcode={reel.shortcode}
                    title={reel.title}
                  />
                </div>

                {/* Reel Metadata & Actions */}
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  {/* Tags & Favorite Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider text-[#AAAAAA] bg-white/5 border border-white/10">
                        {isInstagram ? <InstagramIcon className="h-2.5 w-2.5 text-white" /> : <Film className="h-2.5 w-2.5 text-white" />}
                        {reel.platform}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono capitalize text-[#888888] bg-black/40 border border-white/5">
                        {reel.category}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleToggleFavorite(e, reel.id)}
                      aria-label="Toggle Favorite"
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                        reel.isFavorite
                          ? 'bg-white text-black border-white shadow-[0_2px_10px_rgba(255,255,255,0.3)]'
                          : 'bg-[#181818] border-white/10 text-[#666666] hover:text-white hover:border-white/20'
                      }`}
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${reel.isFavorite ? 'fill-black text-black' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Title & Caption */}
                  <div>
                    <h3 className="font-serif text-base text-white font-normal line-clamp-1">
                      {reel.title || 'Untitled Reel'}
                    </h3>
                    {reel.caption && (
                      <p className="mt-1 text-xs text-[#777777] font-light leading-relaxed line-clamp-2">
                        {reel.caption}
                      </p>
                    )}
                  </div>

                  {/* Footer Info & Actions */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#666666]">
                    <div className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3 text-[#555555]" />
                      <span>{formatDate(reel.savedAt)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={reel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Watch on ${reel.platform}`}
                        className="p-1.5 rounded-xl bg-[#161616] border border-white/10 text-[#AAAAAA] hover:text-white hover:border-white/20 transition-all"
                        title={`Watch on ${isInstagram ? 'Instagram' : 'Facebook'}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        onClick={() => openEditModal(reel)}
                        aria-label="Edit details"
                        className="p-1.5 rounded-xl bg-[#161616] border border-white/10 text-[#AAAAAA] hover:text-white hover:border-white/20 transition-all"
                        title="Edit title & caption"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(reel)}
                        aria-label="Remove reel"
                        className="p-1.5 rounded-xl bg-[#161616] border border-white/10 text-[#AAAAAA] hover:text-white hover:border-white/20 transition-all"
                        title="Remove from gallery"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 4. Privacy & Playback Technical Note Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0D0D0D] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#777777] font-light">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <span className="font-medium text-[#E5E5E5] block">Privacy &amp; Embedded Content Notice</span>
            <span>
              All original source links are stored in our private sanctuary database. Playback is streamed directly from official Instagram/Facebook servers via iframe embeds.
            </span>
          </div>
        </div>
      </div>

      {/* MODAL 1: Add Reel */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddError(null);
          setAddSuccess(null);
        }}
        title="Add to Our Reels"
        description="Paste an Instagram Reel, Instagram post, or Facebook video link to save it forever."
      >
        <form onSubmit={handleAddReel} className="space-y-4">
          {addError && (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/20 text-xs text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-white" />
              <span>{addError}</span>
            </div>
          )}

          {addSuccess && (
            <div className="p-3 rounded-2xl bg-white/10 border border-white/30 text-xs text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
              <span>{addSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-[#AAAAAA] mb-1.5">
              Source URL <span className="text-white">*</span>
            </label>
            <input
              type="url"
              required
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                setAddError(null);
              }}
              placeholder="https://www.instagram.com/reel/DeOofwmCelo/..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all font-mono"
            />
            <p className="mt-1 text-[11px] text-[#666666]">
              Paste the full URL including query parameters.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#AAAAAA] mb-1.5">
              Title <span className="text-[#666666]">(Optional)</span>
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Late night dance in the rain"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#AAAAAA] mb-1.5">
              Personal Caption <span className="text-[#666666]">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              placeholder="Write a sweet note or why this video reminds you of us..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#AAAAAA] mb-1.5">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="romantic">Romantic</option>
                <option value="memories">Memories</option>
                <option value="dates">Dates</option>
                <option value="trips">Trips</option>
                <option value="funny">Funny &amp; Silly</option>
              </select>
            </div>

            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-2xl bg-[#141414] border border-white/10 hover:border-white/20 transition-all">
                <input
                  type="checkbox"
                  checked={newIsFavorite}
                  onChange={(e) => setNewIsFavorite(e.target.checked)}
                  className="rounded border-white/20 bg-black text-white focus:ring-0"
                />
                <span className="text-xs text-[#CCCCCC]">Mark as Favorite</span>
              </label>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#161616] border border-white/10 text-xs text-[#888888] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-[#E5E5E5] transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Reel'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Edit Reel Details */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveReel(null);
        }}
        title="Edit Reel Details"
        description="Update your custom title, caption, or category for this reel."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-[#AAAAAA] mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. Sweet moment together"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#AAAAAA] mb-1.5">
              Personal Caption
            </label>
            <textarea
              rows={3}
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="Add your thoughts or memory note..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#AAAAAA] mb-1.5">
                Category
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="romantic">Romantic</option>
                <option value="memories">Memories</option>
                <option value="dates">Dates</option>
                <option value="trips">Trips</option>
                <option value="funny">Funny &amp; Silly</option>
              </select>
            </div>

            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-2xl bg-[#141414] border border-white/10 hover:border-white/20 transition-all">
                <input
                  type="checkbox"
                  checked={editIsFavorite}
                  onChange={(e) => setEditIsFavorite(e.target.checked)}
                  className="rounded border-white/20 bg-black text-white focus:ring-0"
                />
                <span className="text-xs text-[#CCCCCC]">Favorite</span>
              </label>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#161616] border border-white/10 text-xs text-[#888888] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-[#E5E5E5] transition-all"
            >
              Update Reel
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Delete Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActiveReel(null);
        }}
        title="Remove Reel from Gallery?"
        description="Are you sure you want to remove this video from our shared gallery? This can't be undone."
      >
        <div className="space-y-4 pt-2">
          {activeReel && (
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/10 text-xs space-y-1">
              <div className="font-serif text-white">{activeReel.title || 'Untitled Reel'}</div>
              <div className="font-mono text-[#777777] truncate">{activeReel.url}</div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#161616] border border-white/10 text-xs text-[#888888] hover:text-white transition-all"
            >
              Keep Reel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-[#E5E5E5] transition-all"
            >
              Confirm Remove
            </button>
          </div>
        </div>
      </Modal>

      {/* Media Library Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleSelectFromLibrary}
        multiple
        allowedMediaType="video"
        defaultCategory="reels"
        title="Choose Video from Our Media Library"
        description="Select any uploaded video or reel from our centralized sanctuary library"
      />
    </div>
  );
}
