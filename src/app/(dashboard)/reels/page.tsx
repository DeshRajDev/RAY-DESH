'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Plus,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  MoreVertical,
  Music2,
  ExternalLink,
  Sparkles,
  Play,
  Pause,
  Trash2,
  Edit3,
  Copy,
  Check,
  Images,
  Filter,
  X,
  Send,
} from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Reel, MediaAsset } from '@/types';
import { reelsService } from '@/services/reels.service';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Modal, EmptyState } from '@/components/ui/modal';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import { ExternalVideoEmbed } from '@/components/reels/ExternalVideoEmbed';

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All Reels', value: 'All' },
  { label: 'Romantic', value: 'romantic' },
  { label: 'Memories', value: 'memories' },
  { label: 'Favorites', value: 'favorites' },
  { label: 'Recently Added', value: 'recently_added' },
];

export default function ReelsPage() {
  const router = useRouter();
  const { user, partner, triggerHeartEffect } = useApp();

  const [reels, setReels] = useState<Reel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Play/Pause & Tap Animation state
  const [isPlayingMap, setIsPlayingMap] = useState<Record<number, boolean>>({});
  const [centerIconState, setCenterIconState] = useState<{ index: number; type: 'play' | 'pause' | 'heart' } | null>(null);
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [activeReel, setActiveReel] = useState<Reel | null>(null);

  // Comments state (stored locally per reel)
  const [commentText, setCommentText] = useState('');
  const [reelComments, setReelComments] = useState<Record<string, { id: string; name: string; avatar?: string; text: string; time: string }[]>>({});

  // Add Reel Form State
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newCategory, setNewCategory] = useState('romantic');
  const [newIsFavorite, setNewIsFavorite] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Reel Form State
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editCategory, setEditCategory] = useState('romantic');
  const [editIsFavorite, setEditIsFavorite] = useState(false);

  // Refs
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastTapRef = useRef<number>(0);

  // 1. Fetch & Subscribe to Reels
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

  // 2. Vertical Scroll-Snap & Intersection Observer to manage single active playing reel
  useEffect(() => {
    if (reels.length === 0) return;

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
        threshold: 0.65,
      }
    );

    const cards = feedContainerRef.current?.querySelectorAll('.insta-reel-card');
    cards?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [reels]);

  // 3. Play / Pause videos according to activeReelIndex
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === activeReelIndex) {
        video.muted = isMuted;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlayingMap((prev) => ({ ...prev, [idx]: true }));
            })
            .catch(() => {
              setIsPlayingMap((prev) => ({ ...prev, [idx]: false }));
            });
        }
      } else {
        video.pause();
        video.currentTime = 0;
        setIsPlayingMap((prev) => ({ ...prev, [idx]: false }));
      }
    });
  }, [activeReelIndex, isMuted, reels]);

  // 4. Keyboard Arrow Navigation (Desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToReel(activeReelIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToReel(activeReelIndex - 1);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReelIndex, reels.length]);

  const scrollToReel = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= reels.length) return;
    const el = feedContainerRef.current?.querySelector(`[data-index="${targetIdx}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveReelIndex(targetIdx);
    }
  };

  // 5. Tap Handlers: Single tap play/pause, Double tap like
  const handleVideoTap = (index: number, reel: Reel, e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected: LIKE / FAVORITE
      handleToggleFavorite(reel);
      setCenterIconState({ index, type: 'heart' });
      triggerHeartEffect(e.clientX, e.clientY);
      setTimeout(() => setCenterIconState(null), 900);
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;

    // Single tap after delay: Play/Pause toggle
    setTimeout(() => {
      if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY - 50 && lastTapRef.current !== 0) {
        const video = videoRefs.current[index];
        if (video) {
          if (video.paused) {
            video.play().catch(() => {});
            setIsPlayingMap((prev) => ({ ...prev, [index]: true }));
            setCenterIconState({ index, type: 'play' });
          } else {
            video.pause();
            setIsPlayingMap((prev) => ({ ...prev, [index]: false }));
            setCenterIconState({ index, type: 'pause' });
          }
          setTimeout(() => setCenterIconState(null), 700);
        }
      }
    }, DOUBLE_TAP_DELAY);
  };

  const handleToggleFavorite = async (reel: Reel) => {
    await reelsService.toggleFavorite(reel.id);
    setReels((prev) =>
      prev.map((r) => (r.id === reel.id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
  };

  const handleShareReel = async (reel: Reel) => {
    const shareData = {
      title: reel.title || 'Ray Sanctuary Reel',
      text: reel.caption || 'Watch our romantic moments on Ray ❤️',
      url: window.location.href,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(reel.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleAddComment = (reelId: string) => {
    if (!commentText.trim()) return;
    const newComment = {
      id: `comm_${Date.now()}`,
      name: user.name || 'You',
      avatar: user.avatar,
      text: commentText.trim(),
      time: 'Just now',
    };
    setReelComments((prev) => ({
      ...prev,
      [reelId]: [...(prev[reelId] || []), newComment],
    }));
    setCommentText('');
  };

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
    setIsMediaPickerOpen(false);
  };

  const handleAddReel = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newUrl.trim()) {
      setAddError('Please enter a video URL');
      return;
    }
    setIsSubmitting(true);
    try {
      await reelsService.addReel({
        url: newUrl.trim(),
        title: newTitle.trim(),
        caption: newCaption.trim(),
        category: newCategory,
        isFavorite: newIsFavorite,
      });
      setIsAddModalOpen(false);
      setNewUrl('');
      setNewTitle('');
      setNewCaption('');
      triggerHeartEffect();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to save reel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReel) return;
    setIsSubmitting(true);
    try {
      await reelsService.updateReel(activeReel.id, {
        title: editTitle.trim(),
        caption: editCaption.trim(),
        category: editCategory,
        isFavorite: editIsFavorite,
      });
      setIsEditModalOpen(false);
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReel = async () => {
    if (!activeReel) return;
    setIsSubmitting(true);
    try {
      await reelsService.deleteReel(activeReel.id);
      setIsDeleteModalOpen(false);
      setIsMoreMenuOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentReel = reels[activeReelIndex];

  return (
    <div className="relative w-full h-[100dvh] bg-black text-white flex items-center justify-center overflow-hidden select-none">
      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="w-full max-w-[440px] h-[100dvh] bg-[#0A0A0A] flex flex-col items-center justify-center gap-4 animate-pulse">
          <Film className="h-12 w-12 text-white/30 animate-spin" />
          <p className="font-serif text-sm text-[#888888]">Loading Our Reels Sanctuary...</p>
        </div>
      ) : reels.length === 0 ? (
        <div className="w-full max-w-md p-6 text-center">
          <EmptyState
            icon={<Film className="h-10 w-10 text-white/50" />}
            title="Our Reels Sanctuary is Empty"
            description="Add your downloaded videos, romantic reels, and moments to enjoy them in full-screen immersion."
            actionText="Add Reel"
            onAction={() => setIsAddModalOpen(true)}
          />
        </div>
      ) : (
        /* IMMERSIVE INSTAGRAM-STYLE REELS VIEWER */
        <div className="relative w-full h-[100dvh] max-w-none md:max-w-[430px] md:h-[94dvh] md:rounded-3xl md:border md:border-white/10 md:shadow-2xl overflow-hidden bg-black flex flex-col justify-between">
          
          {/* TOP FLOATING OVERLAY: Back, Title/Category, and Add */}
          <div className="absolute top-0 inset-x-0 z-30 p-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white hover:bg-black/70 transition-all"
              title="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Category Dropdown Pill */}
            <button
              onClick={() => setIsCategorySheetOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs font-medium text-white hover:bg-black/80 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-rose-400" />
              <span>{CATEGORIES.find((c) => c.value === selectedCategory)?.label || 'Reels'}</span>
              <Filter className="h-3 w-3 text-white/70 ml-0.5" />
            </button>

            {/* Add Reel Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-lg"
              title="Add a new Reel"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* DESKTOP FLOATING NAVIGATION CONTROLS */}
          <div className="hidden md:flex absolute -right-16 top-1/2 -translate-y-1/2 flex-col gap-3 z-30">
            <button
              onClick={() => scrollToReel(activeReelIndex - 1)}
              disabled={activeReelIndex === 0}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#161616] border border-white/20 text-white shadow-xl hover:bg-white hover:text-black transition-all disabled:opacity-30 disabled:pointer-events-none"
              title="Previous Reel (Up Arrow)"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollToReel(activeReelIndex + 1)}
              disabled={activeReelIndex === reels.length - 1}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#161616] border border-white/20 text-white shadow-xl hover:bg-white hover:text-black transition-all disabled:opacity-30 disabled:pointer-events-none"
              title="Next Reel (Down Arrow)"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* VERTICAL FULL-SCREEN SCROLL CONTAINER (Scroll-Snap Mandatory) */}
          <div
            ref={feedContainerRef}
            className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none overscroll-y-contain"
          >
            {reels.map((reel, idx) => {
              const isActive = idx === activeReelIndex;
              const isDirectVideo =
                reel.platform === 'upload' ||
                reel.url.endsWith('.mp4') ||
                reel.url.endsWith('.webm') ||
                reel.url.endsWith('.mov') ||
                reel.url.includes('/uploads/') ||
                (!reel.url.includes('instagram.com') && !reel.url.includes('facebook.com') && !reel.url.includes('fb.watch'));

              const creatorName = reel.createdByName || (idx % 2 === 0 ? partner.name : user.name);
              const creatorAvatar = idx % 2 === 0 ? partner.avatar : user.avatar;
              const isCaptionExpanded = expandedCaptions[reel.id] || false;
              const commentsCount = (reelComments[reel.id]?.length || 0) + (reel.isFavorite ? 1 : 0);

              return (
                <div
                  key={reel.id}
                  data-index={idx}
                  className="insta-reel-card snap-start snap-always w-full h-[100dvh] md:h-[94dvh] relative flex items-center justify-center bg-black overflow-hidden shrink-0"
                >
                  {/* 1. VIDEO PLAYER (100% full screen cover) */}
                  {isDirectVideo ? (
                    <div
                      className="w-full h-full relative cursor-pointer"
                      onClick={(e) => handleVideoTap(idx, reel, e)}
                    >
                      <video
                        ref={(el) => {
                          videoRefs.current[idx] = el;
                        }}
                        src={reel.url}
                        poster={reel.thumbnailUrl}
                        loop
                        playsInline
                        muted={isMuted}
                        className="w-full h-full object-cover select-none"
                      />

                      {/* Animated Tap Icons (Play / Pause / Bursting Heart) */}
                      <AnimatePresence>
                        {centerIconState && centerIconState.index === idx && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ type: 'spring', damping: 15 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                          >
                            {centerIconState.type === 'heart' ? (
                              <div className="flex items-center justify-center p-6 rounded-full bg-black/40 backdrop-blur-md">
                                <Heart className="h-20 w-20 fill-rose-500 text-rose-500 animate-pulse drop-shadow-[0_4px_20px_rgba(244,63,94,0.8)]" />
                              </div>
                            ) : centerIconState.type === 'pause' ? (
                              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-md">
                                <Pause className="h-8 w-8 text-white fill-white" />
                              </div>
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-md">
                                <Play className="h-8 w-8 text-white fill-white translate-x-0.5" />
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    /* External Instagram / Facebook Embed Fallback */
                    <div className="w-full h-full flex items-center justify-center bg-[#070707] p-2">
                      <ExternalVideoEmbed
                        url={reel.url}
                        platform={reel.platform}
                        shortcode={reel.shortcode}
                        title={reel.title}
                        isActive={isActive}
                        autoLoad={isActive}
                        isMuted={isMuted}
                        onToggleMute={() => setIsMuted((prev) => !prev)}
                      />
                    </div>
                  )}

                  {/* 2. RIGHT-SIDE INSTAGRAM ACTION COLUMN */}
                  <div className="absolute right-3.5 bottom-24 sm:bottom-20 z-30 flex flex-col items-center gap-5 text-white pointer-events-auto">
                    {/* Like / Heart Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(reel);
                        triggerHeartEffect(e.clientX, e.clientY);
                      }}
                      className="group flex flex-col items-center gap-1 transition-transform active:scale-125"
                      title={reel.isFavorite ? 'Unlike' : 'Like'}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 group-hover:bg-black/60 transition-all">
                        <Heart
                          className={`h-6 w-6 transition-colors ${
                            reel.isFavorite
                              ? 'fill-rose-500 text-rose-500'
                              : 'text-white'
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-medium drop-shadow-md">
                        {reel.isFavorite ? '1' : 'Like'}
                      </span>
                    </button>

                    {/* Comments Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReel(reel);
                        setIsCommentsOpen(true);
                      }}
                      className="group flex flex-col items-center gap-1 transition-transform active:scale-125"
                      title="Comments"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 group-hover:bg-black/60 transition-all">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-[11px] font-mono font-medium drop-shadow-md">
                        {commentsCount > 0 ? commentsCount : 'Comment'}
                      </span>
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareReel(reel);
                      }}
                      className="group flex flex-col items-center gap-1 transition-transform active:scale-125"
                      title="Share Reel"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 group-hover:bg-black/60 transition-all">
                        {copiedLink ? (
                          <Check className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Share2 className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono font-medium drop-shadow-md">
                        {copiedLink ? 'Copied' : 'Share'}
                      </span>
                    </button>

                    {/* Bookmark / Save Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(reel);
                      }}
                      className="group flex flex-col items-center gap-1 transition-transform active:scale-125"
                      title="Save to Sanctuary"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 group-hover:bg-black/60 transition-all">
                        <Bookmark
                          className={`h-5 w-5 transition-colors ${
                            reel.isFavorite ? 'fill-white text-white' : 'text-white'
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-medium drop-shadow-md">
                        Save
                      </span>
                    </button>

                    {/* Sound Mute/Unmute Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted((prev) => !prev);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 transition-all"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4 text-white" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-white" />
                      )}
                    </button>

                    {/* More Options (...) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReel(reel);
                        setEditTitle(reel.title || '');
                        setEditCaption(reel.caption || '');
                        setEditCategory(reel.category || 'romantic');
                        setEditIsFavorite(Boolean(reel.isFavorite));
                        setIsMoreMenuOpen(true);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 transition-all"
                      title="More Options"
                    >
                      <MoreVertical className="h-4 w-4 text-white/80" />
                    </button>
                  </div>

                  {/* 3. BOTTOM INFORMATION OVERLAY: Creator, Caption, Audio Ticker */}
                  <div className="absolute inset-x-0 bottom-0 z-20 pt-16 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] px-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none">
                    <div className="max-w-[78%] space-y-2 pointer-events-auto">
                      {/* Creator Row */}
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          src={creatorAvatar}
                          name={creatorName}
                          size="sm"
                          className="ring-2 ring-white/30 shadow-lg"
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-sm font-medium text-white drop-shadow-md">
                            @{creatorName.toLowerCase().replace(/\s+/g, '')}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider bg-white/20 border border-white/20 text-white backdrop-blur-md uppercase">
                            Sanctuary
                          </span>
                        </div>
                      </div>

                      {/* Title & Caption with Expand / Collapse */}
                      <div className="text-xs text-white/95 leading-relaxed font-light drop-shadow-md">
                        {reel.title && (
                          <h4 className="font-medium text-sm text-white mb-0.5 line-clamp-1">
                            {reel.title}
                          </h4>
                        )}
                        {reel.caption && (
                          <p className={`text-white/90 ${isCaptionExpanded ? '' : 'line-clamp-2'}`}>
                            {reel.caption}
                          </p>
                        )}
                        {reel.caption && reel.caption.length > 80 && (
                          <button
                            onClick={() =>
                              setExpandedCaptions((prev) => ({
                                ...prev,
                                [reel.id]: !prev[reel.id],
                              }))
                            }
                            className="text-white/70 hover:text-white font-medium text-[11px] underline mt-0.5"
                          >
                            {isCaptionExpanded ? 'less' : '...more'}
                          </button>
                        )}
                      </div>

                      {/* Music & Audio Ticker */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <Music2 className="h-3.5 w-3.5 text-rose-300 animate-spin [animation-duration:8s]" />
                        <span className="text-[11px] font-mono text-white/80 truncate">
                          {reel.title ? `Original Audio • ${reel.title}` : 'Original Audio • Ray & Desh Sanctuary'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SLIDE-UP COMMENTS DRAWER */}
          <AnimatePresence>
            {isCommentsOpen && activeReel && (
              <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsCommentsOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                  className="relative w-full max-w-md bg-[#121212] border-t md:border border-white/10 md:rounded-3xl rounded-t-3xl max-h-[75vh] flex flex-col z-10 overflow-hidden shadow-2xl"
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-white" />
                      <h3 className="font-serif text-sm font-medium text-white">Comments</h3>
                    </div>
                    <button
                      onClick={() => setIsCommentsOpen(false)}
                      className="p-1 rounded-full text-white/70 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Comments List */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[45vh]">
                    {(reelComments[activeReel.id] || []).length === 0 ? (
                      <div className="text-center py-8 text-white/50 text-xs">
                        No comments yet. Be the first to leave a little sweet note! ❤️
                      </div>
                    ) : (
                      reelComments[activeReel.id].map((comm) => (
                        <div key={comm.id} className="flex items-start gap-3">
                          <UserAvatar src={comm.avatar} name={comm.name} size="xs" />
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-medium text-white">{comm.name}</span>
                              <span className="text-[10px] text-white/40">{comm.time}</span>
                            </div>
                            <p className="text-xs text-white/80 mt-0.5">{comm.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="p-3 border-t border-white/10 bg-[#0E0E0E] flex items-center gap-2">
                    <UserAvatar src={user.avatar} name={user.name} size="xs" />
                    <input
                      type="text"
                      placeholder={`Add a sweet comment as ${user.name}...`}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddComment(activeReel.id);
                        }
                      }}
                      className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-full px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                    />
                    <button
                      onClick={() => handleAddComment(activeReel.id)}
                      disabled={!commentText.trim()}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black disabled:opacity-40 transition-all"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* CATEGORIES SELECTION SHEET */}
          <AnimatePresence>
            {isCategorySheetOpen && (
              <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsCategorySheetOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                  className="relative w-full max-w-sm bg-[#121212] border-t md:border border-white/10 md:rounded-3xl rounded-t-3xl p-5 z-10 shadow-2xl"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-3">
                    <h3 className="font-serif text-base text-white">Filter Reels Category</h3>
                    <button onClick={() => setIsCategorySheetOpen(false)} className="text-white/60 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.value;
                      return (
                        <button
                          key={cat.value}
                          onClick={() => {
                            setSelectedCategory(cat.value);
                            setIsCategorySheetOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs transition-all ${
                            isSelected
                              ? 'bg-white text-black font-medium shadow-md'
                              : 'bg-[#181818] text-white/80 hover:bg-[#202020]'
                          }`}
                        >
                          <span>{cat.label}</span>
                          {isSelected && <Check className="h-4 w-4 text-black" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* MORE OPTIONS SHEET */}
          <AnimatePresence>
            {isMoreMenuOpen && activeReel && (
              <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                  className="relative w-full max-w-sm bg-[#121212] border-t md:border border-white/10 md:rounded-3xl rounded-t-3xl p-5 z-10 shadow-2xl space-y-2"
                >
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeReel.url);
                      setCopiedLink(true);
                      setIsMoreMenuOpen(false);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#181818] text-xs text-white hover:bg-[#222222]"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Video URL</span>
                  </button>

                  <a
                    href={activeReel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#181818] text-xs text-white hover:bg-[#222222]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open Original Source</span>
                  </a>

                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#181818] text-xs text-white hover:bg-[#222222]"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Reel Details</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-rose-500/10 text-rose-400 text-xs hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-4 w-4 text-rose-400" />
                    <span>Delete from Sanctuary</span>
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ADD REEL MODAL */}
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Save a Romantic Reel"
          >
            <form onSubmit={handleAddReel} className="space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsMediaPickerOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#1A1A1A] border border-white/10 text-xs text-white hover:bg-[#222222] transition-all"
                >
                  <Images className="h-4 w-4 text-rose-400" />
                  <span>Choose from Our Media Library</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#888888] uppercase block mb-1">
                  Video URL or Reel Link *
                </label>
                <input
                  type="url"
                  placeholder="https://www.instagram.com/reel/... or Cloudinary URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#888888] uppercase block mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. A Song That Reminds Me of You"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#888888] uppercase block mb-1">
                  Caption (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add a sweet little message..."
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-mono text-[#888888] uppercase block mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
                  >
                    <option value="romantic">Romantic</option>
                    <option value="memories">Memories</option>
                    <option value="travel">Travel</option>
                    <option value="dreams">Dreams</option>
                  </select>
                </div>
              </div>

              {addError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {addError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#181818] text-xs text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-2xl bg-white text-black text-xs font-medium hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-md"
                >
                  {isSubmitting ? 'Saving...' : 'Save Reel'}
                </button>
              </div>
            </form>
          </Modal>

          {/* EDIT REEL MODAL */}
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Edit Reel Details"
          >
            <form onSubmit={handleUpdateReel} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-[#888888] uppercase block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#888888] uppercase block mb-1">
                  Caption
                </label>
                <textarea
                  rows={2}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#181818] text-xs text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-2xl bg-white text-black text-xs font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </Modal>

          {/* DELETE CONFIRMATION MODAL */}
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="Remove Reel from Sanctuary"
          >
            <div className="space-y-4">
              <p className="text-xs text-white/70">
                Are you sure you want to remove this reel from our private gallery?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#181818] text-xs text-white/70"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteReel}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-2xl bg-rose-500 text-white text-xs font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </Modal>

          {/* PICK FROM MEDIA LIBRARY MODAL */}
          <MediaPickerModal
            isOpen={isMediaPickerOpen}
            onClose={() => setIsMediaPickerOpen(false)}
            onSelect={handleSelectFromLibrary}
            allowedMediaType="video"
            title="Pick from Our Media Library"
          />
        </div>
      )}
    </div>
  );
}
