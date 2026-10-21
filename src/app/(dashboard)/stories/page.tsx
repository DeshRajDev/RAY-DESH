'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Sparkles, 
  Heart, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Music, 
  Send,
  Archive,
  AtSign,
  Smile,
  Upload,
  Disc,
  Clock,
  Trash2,
  Type,
  Move,
  Loader2
} from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Story, Song, StoryTextOverlay } from '@/types';
import { storyService } from '@/services/story.service';
import { musicService } from '@/services/music.service';
import { chatService } from '@/services/chat.service';
import { compressImage } from '@/lib/media-compress';
import { ApiClient } from '@/services/api/client';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/date-utils';

const EMOJI_STICKERS = ['❤️', '✨', '💍', '🌸', '🥂', '🕊️', '💫', '🧸', '🌹', '🔥', '🥰', '🧿', '👑', '💌'];

const PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'
];

const OVERLAY_COLORS = ['#FFFFFF', '#FFB6C1', '#F7D070', '#85E3FF', '#C7B9FF', '#000000'];
const DURATION_PRESETS = [15, 20, 30, 45];

export default function StoriesPage() {
  const { user, partner, triggerHeartEffect } = useApp();
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [stories, setStories] = useState<Story[]>([]);
  const [archivedStories, setArchivedStories] = useState<Story[]>([]);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Create story form state
  const [newStoryType, setNewStoryType] = useState<'image' | 'text' | 'music'>('image');
  const [newStoryMediaUrl, setNewStoryMediaUrl] = useState('');
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const [selectedSong, setSelectedSong] = useState<{ title: string; artist: string }>({ title: '', artist: '' });
  
  // Movable text overlays state
  const [textOverlays, setTextOverlays] = useState<StoryTextOverlay[]>([]);
  const [newOverlayInput, setNewOverlayInput] = useState('');
  const [overlayColor, setOverlayColor] = useState('#FFFFFF');
  const [overlayFontSize, setOverlayFontSize] = useState<number>(20);
  const [overlayBackground, setOverlayBackground] = useState<'dark' | 'glass' | 'none'>('dark');
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);
  
  // Story Duration (15 - 45 seconds, default 15s)
  const [durationSeconds, setDurationSeconds] = useState<number>(15);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Story reply text
  const [storyReplyText, setStoryReplyText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storyService.getStories().then(res => setStories(res.data ?? []));
    storyService.getArchivedStories().then(res => setArchivedStories(res.data ?? []));
    musicService.getSongs().then(res => setAvailableSongs(res.data ?? []));

    const unsubscribe = storyService.subscribe(updated => {
      setStories(updated);
      storyService.getArchivedStories().then(res => setArchivedStories(res.data ?? []));
    });
    return () => unsubscribe();
  }, []);

  // Story viewer auto-advance timer
  const currentViewingList = activeTab === 'archive' ? archivedStories : stories;
  const activeStory = activeStoryIndex !== null ? currentViewingList[activeStoryIndex] : null;

  useEffect(() => {
    if (activeStoryIndex === null || isPaused || !activeStory) return;

    const totalSeconds = Math.max(15, Math.min(45, activeStory.durationSeconds || 15));
    // Interval runs every 100ms. Total ticks = totalSeconds * 10.
    const progressPerTick = 100 / (totalSeconds * 10);

    const interval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          if (activeStoryIndex < currentViewingList.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + progressPerTick;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex, isPaused, currentViewingList.length, activeStory]);

  // Handle optimized file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file, { maxDimension: 1600, quality: 0.85 });
      }
      
      const uploaded = await chatService.uploadMedia(fileToUpload);
      if (uploaded && uploaded.url) {
        setNewStoryMediaUrl(uploaded.url);
      }
    } catch (err) {
      console.warn('Story media upload fallback to data URL:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewStoryMediaUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Add movable text overlay
  const handleAddTextOverlay = () => {
    if (!newOverlayInput.trim()) return;
    const newOverlay: StoryTextOverlay = {
      id: `ov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: newOverlayInput.trim(),
      xPercent: 50,
      yPercent: 45 + (textOverlays.length * 10) % 35,
      color: overlayColor,
      fontSize: overlayFontSize,
      background: overlayBackground,
    };
    setTextOverlays(prev => [...prev, newOverlay]);
    setNewOverlayInput('');
  };

  const removeOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(ov => ov.id !== id));
  };

  // Dragging logic for movable overlays on preview canvas
  const handleCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDraggingId || !previewCanvasRef.current) return;
    const rect = previewCanvasRef.current.getBoundingClientRect();
    const xPercent = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(8, Math.min(92, ((e.clientY - rect.top) / rect.height) * 100));

    setTextOverlays(prev =>
      prev.map(ov => (ov.id === activeDraggingId ? { ...ov, xPercent, yPercent } : ov))
    );
  }, [activeDraggingId]);

  const toggleSticker = (sticker: string) => {
    setSelectedStickers(prev => 
      prev.includes(sticker) ? prev.filter(s => s !== sticker) : [...prev, sticker]
    );
  };

  const toggleMention = (mentionName: string) => {
    setSelectedMentions(prev =>
      prev.includes(mentionName) ? prev.filter(m => m !== mentionName) : [...prev, mentionName]
    );
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valid duration clamp 15 - 45 seconds
    const validatedDuration = Math.max(15, Math.min(45, durationSeconds));

    await storyService.createStory({
      authorId: user.id,
      type: newStoryType,
      mediaUrl: newStoryType === 'image' ? (newStoryMediaUrl || PHOTO_PRESETS[0]) : undefined,
      text: textOverlays.length > 0 ? textOverlays[0].text : undefined,
      songTitle: selectedSong.title || undefined,
      songArtist: selectedSong.artist || undefined,
      caption: newStoryCaption,
      durationSeconds: validatedDuration,
      textOverlays: textOverlays.length > 0 ? textOverlays : undefined,
      stickers: selectedStickers.length > 0 ? selectedStickers : undefined,
      mentions: selectedMentions.length > 0 ? selectedMentions : undefined,
    });

    setIsCreateModalOpen(false);
    setNewStoryCaption('');
    setNewStoryMediaUrl('');
    setTextOverlays([]);
    setSelectedStickers([]);
    setSelectedMentions([]);
    setSelectedSong({ title: '', artist: '' });
    setDurationSeconds(15);
  };

  // Sync story reply directly into real-time chat & notifications
  const handleSendStoryReply = async (storyId: string) => {
    if (!storyReplyText.trim() || !activeStory) return;
    const text = storyReplyText.trim();
    
    await storyService.replyToStory(storyId, text, user.id);

    // Sync to chat conversation
    try {
      const recipientId = activeStory.authorId === user.id ? partner.id : activeStory.authorId;
      await chatService.sendMessage({
        senderId: user.id,
        receiverId: recipientId,
        content: text,
        type: 'text',
        replyToContent: `Replied to story moment: "${activeStory.caption || (activeStory.textOverlays?.[0]?.text) || 'Story'}"`,
        replyToSenderName: activeStory.authorId === user.id ? user.name : partner.name,
      });
    } catch (err) {
      console.warn('Could not sync story reply to chat:', err);
    }

    setStoryReplyText('');
    triggerHeartEffect();
  };

  const handleStoryReaction = async (storyId: string, emoji: string) => {
    await storyService.reactToStory(storyId, emoji, user.id);
    triggerHeartEffect();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 space-y-8 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span>Shared Moments Vault</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Stories</h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            Share moments with movable text overlays, background songs &amp; permanent archive
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Active vs Archive Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#121212] border border-white/10">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'active'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              Active Stories ({stories.length})
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'archive'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archive ({archivedStories.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="clay-btn clay-btn-primary px-4 sm:px-5 py-2 text-xs font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Story
          </button>
        </div>
      </div>

      {/* Story Circles Strip */}
      <div className="rounded-3xl border border-white/10 bg-[#0C0C0C] p-6 shadow-md">
        <div className="flex items-center gap-6 overflow-x-auto pb-2">
          {/* Add story trigger */}
          <div
            onClick={() => setIsCreateModalOpen(true)}
            className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
          >
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#161616] border border-dashed border-white/30 group-hover:border-white transition-all">
              <Plus className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs text-[#AAAAAA] font-light">Add Moment</span>
          </div>

          {/* Stories List */}
          {currentViewingList.map((story, idx) => {
            const isAuthorMe = story.authorId === user.id;
            const author = isAuthorMe ? user : partner;

            return (
              <div
                key={story.id}
                onClick={() => {
                  setActiveStoryIndex(idx);
                  setStoryProgress(0);
                }}
                className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
              >
                <div className="relative p-1 rounded-full border-2 border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-all">
                  <img
                    src={ApiClient.resolveAssetUrl(story.mediaUrl) || author.avatar}
                    alt={author.name}
                    className="h-18 w-18 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                  {story.songTitle && (
                    <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-black border border-white/20 flex items-center justify-center">
                      <Music className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-white font-serif">{author.name}</span>
                <span className="text-[10px] font-mono text-[#666666] -mt-1.5">
                  {formatDate(story.createdAt, 'relative')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Story Gallery Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-white font-normal">
            {activeTab === 'archive' ? 'Permanent Story Archive 🗄️' : 'Active & Recent Stories'}
          </h3>
          <span className="text-xs font-mono text-[#777777]">
            {currentViewingList.length} moments preserved
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {currentViewingList.map((story, idx) => {
            const author = story.authorId === user.id ? user : partner;

            return (
              <div
                key={story.id}
                onClick={() => {
                  setActiveStoryIndex(idx);
                  setStoryProgress(0);
                }}
                className="clay-card-interactive relative h-96 rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between p-6 border border-white/10"
              >
                {/* Background image or gradient */}
                {story.mediaUrl ? (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={ApiClient.resolveAssetUrl(story.mediaUrl)}
                      alt="Story Media"
                      className="h-full w-full object-cover opacity-65 grayscale hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1c] to-[#0A0A0A] z-0" />
                )}

                {/* Top author tag & stickers */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="h-8 w-8 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <span className="text-xs font-serif text-white">{author.name}</span>
                      <p className="text-[10px] font-mono text-[#AAAAAA]">{formatDate(story.createdAt, 'relative')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {story.stickers && story.stickers.map((st, i) => (
                      <span key={i} className="text-base">{st}</span>
                    ))}
                    {story.durationSeconds && (
                      <span className="text-[10px] font-mono bg-black/60 border border-white/10 px-2 py-0.5 rounded-full text-white/80">
                        {story.durationSeconds}s
                      </span>
                    )}
                    {story.isArchived && (
                      <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-white backdrop-blur-md">
                        Vault
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Text Overlays */}
                <div className="relative z-10 my-auto text-center space-y-2 pointer-events-none">
                  {story.textOverlays && story.textOverlays.length > 0 ? (
                    story.textOverlays.slice(0, 2).map((ov) => (
                      <span
                        key={ov.id}
                        style={{ color: ov.color || '#ffffff' }}
                        className="font-serif text-base leading-snug bg-black/60 backdrop-blur-sm px-3.5 py-1 rounded-2xl inline-block shadow-md"
                      >
                        {ov.text}
                      </span>
                    ))
                  ) : story.text ? (
                    <span
                      style={{ color: story.textColor || '#ffffff' }}
                      className="font-serif text-lg leading-snug bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-2xl inline-block"
                    >
                      {story.text}
                    </span>
                  ) : null}

                  {story.mentions && story.mentions.length > 0 && (
                    <div className="flex items-center justify-center gap-1.5">
                      {story.mentions.map((m, i) => (
                        <span key={i} className="text-xs font-mono font-medium text-white bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                          @{m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom content */}
                <div className="relative z-10 space-y-2">
                  {story.songTitle && (
                    <div className="p-2.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white text-xs font-medium">
                        <Disc className="h-4 w-4 animate-spin text-white" />
                        <span className="truncate">{story.songTitle} • {story.songArtist}</span>
                      </div>
                    </div>
                  )}
                  {story.caption && (
                    <p className="text-xs text-[#CCCCCC] font-light line-clamp-2">
                      {story.caption}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL-SCREEN IMMERSIVE STORY VIEWER MODAL */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-8"
          >
            <div
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
              className="relative h-[85vh] max-h-[780px] w-full max-w-sm rounded-3xl overflow-hidden border border-white/15 bg-[#111111] shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col justify-between p-6 select-none"
            >
              {/* Progress bars */}
              <div className="absolute top-4 inset-x-6 z-30 flex gap-1.5">
                {currentViewingList.map((s, i) => (
                  <div key={s.id} className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-100"
                      style={{
                        width:
                          i < (activeStoryIndex ?? 0)
                            ? '100%'
                            : i === activeStoryIndex
                            ? `${storyProgress}%`
                            : '0%',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Author & Close Bar */}
              <div className="relative z-30 mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeStory.authorId === user.id ? user.avatar : partner.avatar}
                    alt="Author"
                    className="h-8 w-8 rounded-full object-cover border border-white/30"
                  />
                  <div>
                    <h4 className="font-serif text-xs text-white">
                      {activeStory.authorId === user.id ? user.name : partner.name}
                    </h4>
                    <p className="text-[10px] font-mono text-[#AAAAAA]">
                      {formatDate(activeStory.createdAt, 'relative')} • {activeStory.durationSeconds || 15}s
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeStory.stickers && activeStory.stickers.map((st, i) => (
                    <span key={i} className="text-xl">{st}</span>
                  ))}
                  <button
                    onClick={() => setActiveStoryIndex(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Background media */}
              {activeStory.mediaUrl && (
                <div className="absolute inset-0 z-0">
                  <img
                    src={ApiClient.resolveAssetUrl(activeStory.mediaUrl)}
                    alt="Story"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                </div>
              )}

              {/* Movable Text Overlays positioned dynamically */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {activeStory.textOverlays && activeStory.textOverlays.length > 0 ? (
                  activeStory.textOverlays.map(ov => (
                    <div
                      key={ov.id}
                      style={{
                        position: 'absolute',
                        left: `${ov.xPercent}%`,
                        top: `${ov.yPercent}%`,
                        transform: 'translate(-50%, -50%)',
                        color: ov.color || '#FFFFFF',
                        fontSize: `${ov.fontSize || 18}px`,
                        backgroundColor: ov.background === 'none' ? 'transparent' : ov.background === 'glass' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.7)',
                        backdropFilter: ov.background === 'none' ? 'none' : 'blur(6px)',
                      }}
                      className="px-3.5 py-1.5 rounded-2xl font-serif text-center shadow-lg border border-white/10 max-w-[85%]"
                    >
                      {ov.text}
                    </div>
                  ))
                ) : activeStory.text ? (
                  <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center">
                    <div className="inline-block p-4 rounded-3xl bg-black/70 border border-white/20 shadow-2xl backdrop-blur-md">
                      <p
                        style={{ color: activeStory.textColor || '#ffffff' }}
                        className="font-serif text-xl font-normal leading-relaxed"
                      >
                        &ldquo;{activeStory.text}&rdquo;
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Middle Music & Mentions Indicator */}
              <div className="relative z-30 my-auto text-center px-4 space-y-3 pointer-events-none">
                {activeStory.mentions && activeStory.mentions.length > 0 && (
                  <div className="flex items-center justify-center gap-2">
                    {activeStory.mentions.map((m, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono font-medium text-white bg-white/30 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/40 shadow-md"
                      >
                        @{m}
                      </span>
                    ))}
                  </div>
                )}

                {activeStory.songTitle && (
                  <div className="p-3 rounded-2xl bg-black/80 border border-white/20 shadow-xl inline-flex items-center gap-2.5 backdrop-blur-md">
                    <Music className="h-4 w-4 text-white animate-bounce" />
                    <div className="text-left">
                      <h5 className="font-serif text-xs text-white">{activeStory.songTitle}</h5>
                      <p className="text-[10px] text-[#AAAAAA]">{activeStory.songArtist}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Caption & Interactive Reply Composer */}
              <div className="relative z-30 space-y-3">
                {activeStory.caption && (
                  <p className="text-xs text-[#E5E5E5] font-light bg-black/60 p-2.5 rounded-xl backdrop-blur-md">
                    {activeStory.caption}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={storyReplyText}
                    onChange={e => setStoryReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendStoryReply(activeStory.id);
                    }}
                    placeholder={`Reply privately to ${activeStory.authorId === user.id ? 'yourself' : partner.name}...`}
                    className="clay-input flex-1 h-10 px-3.5 text-xs text-white placeholder-[#777777]"
                  />
                  <button
                    onClick={() => handleSendStoryReply(activeStory.id)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleStoryReaction(activeStory.id, '❤️')}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] border border-white/10 text-white hover:scale-110 active:scale-90 transition-transform"
                  >
                    <Heart className="h-4 w-4 fill-white" />
                  </button>
                </div>
              </div>

              {/* Left/Right Tap Areas */}
              <div
                onClick={() => {
                  if (activeStoryIndex !== null && activeStoryIndex > 0) {
                    setActiveStoryIndex(activeStoryIndex - 1);
                    setStoryProgress(0);
                  }
                }}
                className="absolute inset-y-20 left-0 w-1/3 z-25 cursor-pointer"
              />
              <div
                onClick={() => {
                  if (activeStoryIndex !== null && activeStoryIndex < currentViewingList.length - 1) {
                    setActiveStoryIndex(activeStoryIndex + 1);
                    setStoryProgress(0);
                  } else {
                    setActiveStoryIndex(null);
                  }
                }}
                className="absolute inset-y-20 right-0 w-1/3 z-25 cursor-pointer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE STORY MODAL WITH MOVABLE TEXT & DURATION */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Story Moment"
        description="Craft a moment with movable text overlays, duration, stickers & background music."
      >
        <form onSubmit={handleCreateStory} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* 1. Story Media Type Switcher */}
          <div className="flex gap-2 p-1 bg-[#141414] rounded-2xl border border-white/5">
            {(['image', 'text', 'music'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setNewStoryType(type)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                  newStoryType === type ? 'bg-white text-black shadow' : 'text-[#777777] hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* 2. Image Selection & Upload */}
          {newStoryType === 'image' && (
            <div className="space-y-3">
              <label className="text-xs text-[#AAAAAA]">Choose Image or Fast Compress Upload</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStoryMediaUrl}
                  onChange={e => setNewStoryMediaUrl(e.target.value)}
                  placeholder="Paste image URL (https://...)"
                  className="clay-input flex-1 h-9 px-3 text-xs"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingMedia}
                  onClick={() => fileInputRef.current?.click()}
                  className="clay-btn px-3 text-xs flex items-center gap-1.5 bg-[#1C1C1C] border border-white/10 text-white hover:bg-white hover:text-black transition-all"
                >
                  {isUploadingMedia ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {isUploadingMedia ? 'Compressing...' : 'Upload'}
                </button>
              </div>

              {/* Preset Quick Select */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PHOTO_PRESETS.map((preset, idx) => (
                  <img
                    key={idx}
                    src={preset}
                    alt="preset"
                    onClick={() => setNewStoryMediaUrl(preset)}
                    className={`h-12 w-12 rounded-xl object-cover cursor-pointer border-2 transition-all shrink-0 ${
                      newStoryMediaUrl === preset ? 'border-white scale-105' : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 3. Interactive Preview Canvas with Movable Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#AAAAAA]">
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase">
                <Move className="h-3.5 w-3.5 text-white" /> Canvas Preview (Drag text anywhere)
              </span>
              <span className="text-[10px] text-[#777]">{textOverlays.length} overlays placed</span>
            </div>

            <div
              ref={previewCanvasRef}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={() => setActiveDraggingId(null)}
              className="relative w-full h-72 rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/15 select-none touch-none flex items-center justify-center shadow-inner"
            >
              {newStoryMediaUrl ? (
                <img
                  src={ApiClient.resolveAssetUrl(newStoryMediaUrl)}
                  alt="Story Canvas"
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <div className="text-center p-4 text-[#555] space-y-1">
                  <Type className="h-6 w-6 mx-auto opacity-40" />
                  <p className="text-xs">Select an image or write text overlays below</p>
                </div>
              )}

              {/* Render Draggable Text Overlays on Canvas */}
              {textOverlays.map(ov => (
                <div
                  key={ov.id}
                  style={{
                    position: 'absolute',
                    left: `${ov.xPercent}%`,
                    top: `${ov.yPercent}%`,
                    transform: 'translate(-50%, -50%)',
                    color: ov.color || '#FFFFFF',
                    fontSize: `${ov.fontSize || 18}px`,
                    backgroundColor: ov.background === 'none' ? 'transparent' : ov.background === 'glass' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.7)',
                    backdropFilter: ov.background === 'none' ? 'none' : 'blur(4px)',
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setActiveDraggingId(ov.id);
                  }}
                  className={`cursor-grab active:cursor-grabbing px-3 py-1 rounded-xl shadow-lg border border-white/20 select-none flex items-center gap-1.5 transition-shadow ${
                    activeDraggingId === ov.id ? 'ring-2 ring-white scale-105' : ''
                  }`}
                >
                  <span className="font-serif font-light">{ov.text}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOverlay(ov.id);
                    }}
                    className="h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] hover:bg-white hover:text-black"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Controls to Add New Movable Text Overlay */}
            <div className="p-3 rounded-2xl bg-[#141414] border border-white/10 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOverlayInput}
                  onChange={e => setNewOverlayInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTextOverlay();
                    }
                  }}
                  placeholder="Type text overlay and drag it on the preview..."
                  className="clay-input flex-1 h-9 px-3 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddTextOverlay}
                  className="clay-btn clay-btn-primary px-3 text-xs shrink-0 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Text
                </button>
              </div>

              {/* Text styling chips: color, size, background */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Colors */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#777] font-mono">COLOR:</span>
                  {OVERLAY_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setOverlayColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-5 w-5 rounded-full border border-white/30 transition-transform ${
                        overlayColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-80'
                      }`}
                    />
                  ))}
                </div>

                {/* Font Size */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#777] font-mono">SIZE:</span>
                  {[16, 20, 26, 32].map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setOverlayFontSize(sz)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                        overlayFontSize === sz
                          ? 'bg-white text-black border-white'
                          : 'bg-[#1e1e1e] text-[#888] border-white/10'
                      }`}
                    >
                      {sz}px
                    </button>
                  ))}
                </div>

                {/* Background style */}
                <div className="flex items-center gap-1">
                  {(['dark', 'glass', 'none'] as const).map(bg => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setOverlayBackground(bg)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize border transition-all ${
                        overlayBackground === bg
                          ? 'bg-white text-black border-white'
                          : 'bg-[#1e1e1e] text-[#888] border-white/10'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Story Duration: 15–45 seconds */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#AAAAAA]">
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase">
                <Clock className="h-3.5 w-3.5 text-white" /> Story Duration (15–45s)
              </span>
              <span className="font-mono text-white text-xs">{durationSeconds} seconds</span>
            </div>
            <div className="flex items-center gap-2">
              {DURATION_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDurationSeconds(preset)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all ${
                    durationSeconds === preset
                      ? 'bg-white text-black border-white shadow'
                      : 'bg-[#161616] text-[#888] border-white/10 hover:text-white'
                  }`}
                >
                  {preset}s {preset === 15 ? '(Default)' : ''}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={15}
              max={45}
              step={1}
              value={durationSeconds}
              onChange={e => setDurationSeconds(parseInt(e.target.value, 10))}
              className="w-full accent-white h-1.5 bg-[#222] rounded-lg cursor-pointer"
            />
          </div>

          {/* 5. Background Song Attachment */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase text-[#AAAAAA] flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-white" /> Attach Music from Vault
            </span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedSong.title}
                onChange={e => {
                  const song = availableSongs.find(s => s.title === e.target.value);
                  if (song) {
                    setSelectedSong({ title: song.title, artist: song.artist });
                  } else {
                    setSelectedSong({ title: '', artist: '' });
                  }
                }}
                className="clay-input h-10 px-3 text-xs bg-[#141414] text-white"
              >
                <option value="">-- Select from our song vault --</option>
                {availableSongs.map(s => (
                  <option key={s.id} value={s.title}>
                    {s.title} ({s.artist})
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Or custom song title"
                value={selectedSong.title}
                onChange={e => setSelectedSong({ ...selectedSong, title: e.target.value })}
                className="clay-input h-10 px-3 text-xs"
              />
            </div>
            {selectedSong.title && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="text-white truncate">🎵 {selectedSong.title} {selectedSong.artist ? `by ${selectedSong.artist}` : ''}</span>
                <button
                  type="button"
                  onClick={() => setSelectedSong({ title: '', artist: '' })}
                  className="text-[#888] hover:text-white text-xs ml-2"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* 6. Mention Partner Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#AAAAAA]">
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase">
                <AtSign className="h-3.5 w-3.5 text-white" /> Mention Partner
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleMention(partner.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedMentions.includes(partner.name)
                    ? 'bg-white text-black border-white'
                    : 'bg-[#181818] text-[#888888] border-white/10 hover:text-white'
                }`}
              >
                @{partner.name} ({partner.nickname})
              </button>
              <button
                type="button"
                onClick={() => toggleMention(user.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedMentions.includes(user.name)
                    ? 'bg-white text-black border-white'
                    : 'bg-[#181818] text-[#888888] border-white/10 hover:text-white'
                }`}
              >
                @{user.name}
              </button>
            </div>
          </div>

          {/* 7. Emojis & Stickers Selector */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase text-[#AAAAAA] flex items-center gap-1.5">
              <Smile className="h-3.5 w-3.5 text-white" /> Add Romantic Stickers
            </span>
            <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-[#141414] border border-white/10">
              {EMOJI_STICKERS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => toggleSticker(emoji)}
                  className={`h-8 w-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                    selectedStickers.includes(emoji)
                      ? 'bg-white/20 scale-125 ring-1 ring-white'
                      : 'hover:bg-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 8. Caption */}
          <div className="space-y-2">
            <label className="text-xs text-[#AAAAAA]">Caption</label>
            <input
              type="text"
              value={newStoryCaption}
              onChange={e => setNewStoryCaption(e.target.value)}
              placeholder="Add a gentle memory note..."
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="clay-btn clay-btn-secondary px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploadingMedia}
              className="clay-btn clay-btn-primary px-5 py-2 text-xs font-medium flex items-center gap-1.5"
            >
              {isUploadingMedia ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Post Story ({durationSeconds}s)
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
