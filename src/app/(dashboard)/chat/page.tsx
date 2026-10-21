'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Image as ImageIcon, 
  Mic, 
  Pin, 
  Check, 
  CheckCheck, 
  Heart, 
  Reply, 
  Trash2, 
  X, 
  Search, 
  Play, 
  Pause, 
  Sparkles,
  Info,
  Palette,
  Upload,
  Download,
  AlertCircle,
  Loader2,
  Camera,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { useRouter } from 'next/navigation';
import { Message, MessageAttachment } from '@/types';
import { chatService, ChatWallpaper, UserPresence } from '@/services/chat.service';
import { ApiClient } from '@/services/api/client';
import { compressImage } from '@/lib/media-compress';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { formatDate, formatTime } from '@/lib/date-utils';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';

const POPULAR_REACTIONS = ['❤️', '😂', '🥹', '😘', '😍', '😢', '🔥', '👍', '🎉'];

const WALLPAPER_PRESETS: { id: string; name: string; url: string; preview: string }[] = [
  {
    id: 'obsidian',
    name: 'Clean Obsidian',
    url: '',
    preview: '#070707',
  },
  {
    id: 'starry',
    name: 'Starry Starlight',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    preview: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'misty-forest',
    name: 'Misty Pine Forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&auto=format&fit=crop&q=80',
    preview: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'candle-light',
    name: 'Candlelight Cozy',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1600&auto=format&fit=crop&q=80',
    preview: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'sunset-peaks',
    name: 'Sunset Mountain Peaks',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
    preview: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'rose-petals',
    name: 'Velvet Rose',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    preview: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
  },
];

export default function ChatPage() {
  const router = useRouter();
  const { user, partner, couple, openMediaViewer, triggerHeartEffect } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeAttachment, setActiveAttachment] = useState<MessageAttachment | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showRightInfo, setShowRightInfo] = useState(false);
  const [activePlayingVoiceId, setActivePlayingVoiceId] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Presence & Typing State
  const [partnerPresence, setPartnerPresence] = useState<UserPresence>(() => 
    chatService.getPartnerPresence(partner.id)
  );
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // Wallpaper State
  const [wallpaper, setWallpaper] = useState<ChatWallpaper>(() => chatService.getWallpaper());
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  // Initialize Real Socket Connection & Mark Chat as Active
  useEffect(() => {
    chatService.initSocket(user.id);
    chatService.setChatViewActive(true);

    const unsubConnection = chatService.subscribeConnection(connected => {
      setIsSocketConnected(connected);
    });

    const unsubPresence = chatService.subscribePresence(data => {
      if (data.userId === partner.id) {
        setPartnerPresence(data);
      }
    });

    const unsubTyping = chatService.subscribeTyping(data => {
      if (data.userId === partner.id) {
        setIsPartnerTyping(data.isTyping);
      }
    });

    const unsubWallpaper = chatService.subscribeWallpaper(updatedWp => {
      setWallpaper(updatedWp);
    });

    const unsubMessages = chatService.subscribe(updated => {
      setMessages(updated);
    });

    // Load initial messages from backend
    chatService.getMessages()
      .then(res => {
        setMessages(res.data ?? []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    return () => {
      chatService.setChatViewActive(false);
      chatService.stopTyping(user.id);
      unsubConnection();
      unsubPresence();
      unsubTyping();
      unsubWallpaper();
      unsubMessages();
    };
  }, [user.id, partner.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (val.trim()) {
      chatService.sendTyping(user.id);
    } else {
      chatService.stopTyping(user.id);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !activeAttachment) return;

    chatService.stopTyping(user.id);

    if (editingMessage) {
      await chatService.editMessage(editingMessage.id, inputText);
      setEditingMessage(null);
      setInputText('');
      return;
    }

    const attachments = activeAttachment ? [activeAttachment] : undefined;
    const type: Message['type'] = activeAttachment?.type === 'audio' 
      ? 'voice' 
      : activeAttachment?.type === 'image' 
      ? 'image' 
      : activeAttachment?.type === 'video' 
      ? 'video' 
      : 'text';

    const textToSend = inputText.trim();
    setInputText('');
    setReplyMessage(null);
    setActiveAttachment(null);
    setShowEmojiPicker(false);

    await chatService.sendMessage({
      senderId: user.id,
      receiverId: partner.id,
      content: textToSend,
      type,
      attachments,
      replyToId: replyMessage?.id,
      replyToContent: replyMessage?.content,
      replyToSenderName: replyMessage ? (replyMessage.senderId === user.id ? user.name : partner.name) : undefined,
    });
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    chatService.toggleReaction(messageId, emoji, user.id);
    if (emoji === '❤️') {
      triggerHeartEffect();
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    chatService.deleteMessage(messageId);
  };

  const handleTogglePin = (messageId: string) => {
    chatService.togglePin(messageId);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    setMediaUploadError(null);

    try {
      const fileToUpload = await compressImage(file);
      const uploaded = await chatService.uploadMedia(fileToUpload);
      setActiveAttachment({
        id: `att_${Date.now()}`,
        type: uploaded.type,
        url: uploaded.url,
        name: uploaded.name,
        size: uploaded.size,
      });
    } catch (err: any) {
      setMediaUploadError(err.message || 'Media upload failed. Please try again.');
    } finally {
      setIsUploadingMedia(false);
      // Reset input value to allow selecting same file again
      e.target.value = '';
    }
  };

  const handleDownloadMedia = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleWallpaperFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const newWp: ChatWallpaper = {
          type: 'custom',
          value: reader.result,
          opacity: wallpaper.opacity,
          blur: wallpaper.blur,
        };
        chatService.setWallpaper(newWp);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendSimulatedVoice = async () => {
    setIsRecordingVoice(true);
    setTimeout(async () => {
      setIsRecordingVoice(false);
      await chatService.sendMessage({
        senderId: user.id,
        receiverId: partner.id,
        content: 'Voice note (0:18)',
        type: 'voice',
        attachments: [
          {
            id: `att_${Date.now()}`,
            type: 'audio',
            url: '#',
            name: 'voice_note.mp3',
            duration: 18,
          }
        ]
      });
    }, 2000);
  };

  // WhatsApp-style presence indicator in header
  const presenceSubtitle = useMemo(() => {
    if (isPartnerTyping) {
      return <span className="text-emerald-400 font-medium italic">typing...</span>;
    }
    if (partnerPresence.isOnline) {
      return <span className="text-emerald-400 font-medium">online</span>;
    }
    if (partnerPresence.lastSeen) {
      const date = new Date(partnerPresence.lastSeen);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = formatTime(partnerPresence.lastSeen);
      if (isToday) {
        return <span className="text-[#888888]">last seen today at {timeStr}</span>;
      }
      return <span className="text-[#888888]">last seen {formatDate(partnerPresence.lastSeen, 'short')} at {timeStr}</span>;
    }
    return <span className="text-[#666666]">offline</span>;
  }, [isPartnerTyping, partnerPresence]);

  const pinnedMessages = messages.filter(m => m.isPinned);
  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex flex-1 min-h-0 w-full overflow-hidden bg-[#070707] relative">
      {/* Main Chat Column */}
      <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden border-r border-white/5">
        {/* Chat Top Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0A0A0A]/95 px-3 sm:px-6 backdrop-blur-md z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={partner.avatar}
                alt={partner.name}
                className="h-10 w-10 rounded-full object-cover border border-white/20 shadow-md"
              />
              {partnerPresence.isOnline && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-sm sm:text-base font-medium text-white">
                  {partner.name} <span className="text-xs text-[#777777] font-normal">({partner.nickname})</span>
                </h2>
                {!isSocketConnected && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20" title="Reconnecting to real-time socket...">
                    <WifiOff className="h-2.5 w-2.5" />
                    Connecting
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono leading-none mt-0.5">
                {presenceSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#666666]" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 w-44 rounded-full bg-[#141414] pl-8 pr-3 text-xs text-white placeholder-[#555555] border border-white/5 focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Chat Wallpaper Button */}
            <button
              onClick={() => setIsWallpaperModalOpen(true)}
              aria-label="Change Chat Wallpaper"
              title="Chat Wallpaper"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#141414] border border-white/10 text-[#AAAAAA] hover:text-white transition-colors"
            >
              <Palette className="h-4 w-4" />
            </button>

            <button
              onClick={() => triggerHeartEffect()}
              aria-label="Send Heart"
              title="Send Heart"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#141414] border border-white/10 text-white hover:bg-white hover:text-black transition-colors"
            >
              <Heart className="h-4 w-4 fill-current" />
            </button>

            <button
              onClick={() => setShowRightInfo(prev => !prev)}
              aria-label="Chat Info"
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                showRightInfo ? 'bg-white text-black border-white' : 'bg-[#141414] border-white/10 text-[#AAAAAA] hover:text-white'
              }`}
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Pinned Messages Bar */}
        {pinnedMessages.length > 0 && (
          <div className="flex items-center justify-between bg-[#111111]/90 backdrop-blur-md px-4 py-2 border-b border-white/5 text-xs text-[#AAAAAA] z-10">
            <div className="flex items-center gap-2 min-w-0">
              <Pin className="h-3.5 w-3.5 text-white shrink-0" />
              <span className="font-mono text-[11px] text-[#777777] uppercase">Pinned:</span>
              <p className="truncate text-white text-xs">{pinnedMessages[pinnedMessages.length - 1].content}</p>
            </div>
            <span className="text-[10px] font-mono text-[#666666] shrink-0 ml-2">
              {pinnedMessages.length} pinned
            </span>
          </div>
        )}

        {/* Messages Scroll Area with WhatsApp-like Wallpaper Background */}
        <div className="relative flex-1 overflow-hidden flex flex-col">
          {/* Custom Wallpaper Backdrop */}
          {wallpaper.value && (
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-500 bg-cover bg-center"
              style={{
                backgroundImage: wallpaper.type === 'color' ? 'none' : `url(${wallpaper.value})`,
                backgroundColor: wallpaper.type === 'color' ? wallpaper.value : '#070707',
                opacity: (wallpaper.opacity ?? 100) / 100,
                filter: `blur(${wallpaper.blur ?? 0}px)`,
              }}
            />
          )}

          {/* Darkening tint overlay for maximum message legibility */}
          <div className="absolute inset-0 pointer-events-none bg-black/60" />

          {/* Messages Container */}
          <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 z-10">
            <div className="flex justify-center my-2">
              <span className="rounded-full bg-black/70 backdrop-blur-md px-3.5 py-1 text-[10px] font-mono text-[#888888] border border-white/10 shadow-sm">
                🔒 End-to-end private sanctuary between {user.name} &amp; {partner.name}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-4 py-4">
                <div className="flex flex-col items-start space-y-1 max-w-xs">
                  <Skeleton className="h-10 w-48 rounded-2xl rounded-bl-sm" />
                </div>
                <div className="flex flex-col items-end space-y-1 ml-auto max-w-xs">
                  <Skeleton className="h-12 w-56 rounded-2xl rounded-br-sm" />
                </div>
                <div className="flex flex-col items-start space-y-1 max-w-xs">
                  <Skeleton className="h-16 w-64 rounded-2xl rounded-bl-sm" />
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h4 className="font-serif text-base text-white">Our Private Sanctuary Chat</h4>
                <p className="text-xs text-[#777777] max-w-xs font-light leading-relaxed">
                  No messages yet. Send your first whisper to {partner.name} below.
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = 
                  msg.senderId === user.id ||
                  msg.senderId === (user as any)._id ||
                  (user.role === 'partner1' && (msg.senderId === 'user_1' || msg.senderId === (couple as any)?.partner1Id || msg.senderId === (couple as any)?.partner1?.id)) ||
                  (user.role === 'partner2' && (msg.senderId === 'user_2' || msg.senderId === (couple as any)?.partner2Id || msg.senderId === (couple as any)?.partner2?.id)) ||
                  Boolean((msg as any).senderRole && (msg as any).senderRole === user.role);

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`group relative flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Story reply card reference if exists */}
                    {(msg as any).storyReference && (
                      <div
                        onClick={() => router.push('/stories')}
                        className={`mb-1.5 flex items-center gap-2.5 max-w-sm rounded-xl bg-black/60 border border-white/20 p-2 text-left cursor-pointer hover:bg-black/80 transition-colors backdrop-blur-md ${isMe ? 'mr-2' : 'ml-2'}`}
                      >
                        {(msg as any).storyReference.mediaUrl && (
                          <img
                            src={ApiClient.resolveAssetUrl((msg as any).storyReference.mediaUrl)}
                            alt="Story"
                            className="h-10 w-10 rounded-lg object-cover border border-white/10 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">Story Reply</span>
                          <p className="text-[11px] text-white/90 truncate">{(msg as any).storyReference.caption || 'View Story'}</p>
                        </div>
                      </div>
                    )}

                    {/* Reply context if exists */}
                    {msg.replyToContent && (
                      <div className={`mb-1 max-w-sm rounded-xl bg-black/60 border border-white/15 px-3 py-1 text-[11px] text-[#AAAAAA] backdrop-blur-sm ${isMe ? 'mr-2' : 'ml-2'}`}>
                        <span className="font-semibold text-white">{msg.replyToSenderName}:</span> {msg.replyToContent}
                      </div>
                    )}

                    <div className="relative flex items-end gap-1.5 group max-w-[88%] sm:max-w-md">
                      {/* Action triggers for hovering message */}
                      <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center gap-1 z-20 ${
                        isMe ? 'right-full mr-1.5' : 'left-full ml-1.5'
                      }`}>
                        <button
                          onClick={() => setReplyMessage(msg)}
                          className="p-1 rounded-full bg-[#181818] border border-white/10 text-[#AAAAAA] hover:text-white"
                          title="Reply"
                        >
                          <Reply className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleTogglePin(msg.id)}
                          className={`p-1 rounded-full border transition-colors ${
                            msg.isPinned ? 'bg-white text-black border-white' : 'bg-[#181818] border-white/10 text-[#AAAAAA] hover:text-white'
                          }`}
                          title="Pin message"
                        >
                          <Pin className="h-3 w-3" />
                        </button>
                        {isMe && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 rounded-full bg-[#181818] border border-white/10 text-[#AAAAAA] hover:text-red-400"
                            title="Delete message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* WhatsApp-Style Chat Bubble with Natural Wrapping */}
                      <div
                        className={`relative rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-md backdrop-blur-md transition-all max-w-full overflow-hidden ${
                          isMe
                            ? 'bg-gradient-to-b from-[#282828] to-[#1C1C1C] text-white rounded-tr-none border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.6)]'
                            : 'bg-[#121212]/95 text-[#EDEDED] rounded-tl-none border border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.5)]'
                        }`}
                      >
                        {/* Attached Media (Image / Playable Video / Voice) */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mb-2 space-y-2">
                            {msg.attachments.map(att => (
                              <div key={att.id} className="overflow-hidden rounded-xl">
                                {/* Image Display & Download */}
                                {att.type === 'image' && (
                                  <div className="relative group/media overflow-hidden rounded-xl">
                                    <img
                                      src={ApiClient.resolveAssetUrl(att.url)}
                                      alt="attachment"
                                      onClick={() => openMediaViewer([ApiClient.resolveAssetUrl(att.url)])}
                                      className="max-h-72 w-auto max-w-full object-cover cursor-pointer rounded-xl hover:opacity-95 transition-opacity"
                                    />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover/media:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const dateStr = new Date(msg.createdAt).toISOString().split('T')[0];
                                          handleDownloadMedia(ApiClient.resolveAssetUrl(att.url), `Ray-Chat-Photo-${dateStr}.jpg`);
                                        }}
                                        title="Download original photo"
                                        className="p-1.5 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/20 hover:scale-110 active:scale-95 transition-transform"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Native Playable Video Display & Download */}
                                {att.type === 'video' && (
                                  <div className="relative group/media overflow-hidden rounded-xl bg-black border border-white/10">
                                    <video
                                      src={ApiClient.resolveAssetUrl(att.url)}
                                      controls
                                      playsInline
                                      preload="metadata"
                                      className="max-h-72 w-full rounded-xl object-contain bg-black"
                                    />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover/media:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => {
                                          const dateStr = new Date(msg.createdAt).toISOString().split('T')[0];
                                          handleDownloadMedia(ApiClient.resolveAssetUrl(att.url), `Ray-Chat-Video-${dateStr}.mp4`);
                                        }}
                                        title="Download original video"
                                        className="p-1.5 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/20 hover:scale-110 active:scale-95 transition-transform"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Voice note playback */}
                                {att.type === 'audio' && (
                                  <div className={`flex items-center gap-3 p-2 rounded-xl ${isMe ? 'bg-black/10' : 'bg-white/10'}`}>
                                    <button
                                      onClick={() => {
                                        setActivePlayingVoiceId(activePlayingVoiceId === att.id ? null : att.id);
                                      }}
                                      className={`h-8 w-8 rounded-full flex items-center justify-center ${isMe ? 'bg-black text-white' : 'bg-white text-black'}`}
                                    >
                                      {activePlayingVoiceId === att.id ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                                    </button>
                                    <div className="flex-1">
                                      <div className="h-1 bg-current opacity-30 rounded-full w-28" />
                                      <span className="text-[10px] font-mono mt-1 block opacity-70">
                                        {att.duration ? `0:${att.duration}` : '0:18'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Content with natural wrapping */}
                        {msg.content && (
                          <p className="leading-relaxed whitespace-pre-wrap break-words font-light">
                            {msg.content}
                          </p>
                        )}

                        {/* Metadata row with real WhatsApp delivery ticks */}
                        <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] font-mono select-none ${
                          isMe ? 'text-[#555555]' : 'text-[#888888]'
                        }`}>
                          {msg.isPinned && <Pin className="h-2.5 w-2.5" />}
                          {msg.isEdited && <span>edited</span>}
                          <span>{formatTime(msg.createdAt)}</span>

                          {/* WhatsApp Status Indicators for Outgoing Messages */}
                          {isMe && (
                            <span className="flex items-center ml-0.5">
                              {msg.status === 'sending' ? (
                                <span className="h-2.5 w-2.5 rounded-full border border-current border-t-transparent animate-spin inline-block opacity-70" title="Sending message..." />
                              ) : msg.status === 'failed' ? (
                                <button
                                  onClick={() => chatService.retryMessage(msg.id)}
                                  className="text-red-500 hover:text-red-400 flex items-center gap-1"
                                  title="Message failed to send. Click to retry."
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  <span className="text-[9px] underline">Retry</span>
                                </button>
                              ) : msg.status === 'read' || msg.isRead ? (
                                <span title={`Read ${msg.readAt ? formatTime(msg.readAt) : ''}`}>
                                  <CheckCheck className="h-3.5 w-3.5 text-sky-400" />
                                </span>
                              ) : msg.status === 'delivered' || msg.isDelivered ? (
                                <span title={`Delivered ${msg.deliveredAt ? formatTime(msg.deliveredAt) : ''}`}>
                                  <CheckCheck className="h-3.5 w-3.5 text-[#888888]" />
                                </span>
                              ) : (
                                <span title="Sent to server">
                                  <Check className="h-3.5 w-3.5 text-[#888888]" />
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Quick Reactions Bar below message */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="absolute -bottom-3 right-2 flex items-center gap-1 bg-[#222222] border border-white/20 rounded-full px-1.5 py-0.5 shadow-md">
                            {msg.reactions.map((r, i) => (
                              <span key={i} className="text-xs cursor-pointer hover:scale-125 transition-transform" onClick={() => handleToggleReaction(msg.id, r.emoji)}>
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* Real-time Partner Typing Bubble in Chat Area */}
            {isPartnerTyping && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex items-center gap-2 max-w-xs"
              >
                <div className="h-7 w-7 rounded-full overflow-hidden border border-white/20 shrink-0">
                  <img src={partner.avatar} alt={partner.name} className="h-full w-full object-cover" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-[#181818]/90 border border-white/10 px-3.5 py-2 flex items-center gap-1.5 shadow-md">
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" />
                  <span className="text-[11px] font-mono text-[#888888] ml-1.5 italic">typing...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply Context Preview */}
        {replyMessage && (
          <div className="flex items-center justify-between bg-[#121212] px-4 py-2 border-t border-white/10 text-xs text-[#AAAAAA] z-20">
            <div className="flex items-center gap-2 min-w-0">
              <Reply className="h-3.5 w-3.5 text-white shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-white block text-[11px]">
                  Replying to {replyMessage.senderId === user.id ? 'yourself' : partner.name}
                </span>
                <p className="truncate text-xs text-[#888888]">{replyMessage.content}</p>
              </div>
            </div>
            <button onClick={() => setReplyMessage(null)} className="p-1 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Upload in-progress indicator */}
        {isUploadingMedia && (
          <div className="flex items-center gap-2 bg-[#141414] px-4 py-2 border-t border-white/10 text-xs text-white z-20">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            <span>Uploading media to secure sanctuary storage...</span>
          </div>
        )}

        {/* Upload error banner */}
        {mediaUploadError && (
          <div className="flex items-center justify-between bg-red-950/80 border-t border-red-500/30 px-4 py-2 text-xs text-red-200 z-20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span>{mediaUploadError}</span>
            </div>
            <button onClick={() => setMediaUploadError(null)} className="p-1 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Attachment preview if selected */}
        {activeAttachment && (
          <div className="flex items-center justify-between bg-[#121212] px-4 py-2 border-t border-white/10 text-xs text-white z-20">
            <div className="flex items-center gap-3 min-w-0">
              {activeAttachment.type === 'image' ? (
                <img src={activeAttachment.url} alt="preview" className="h-8 w-8 rounded-lg object-cover border border-white/20 shrink-0" />
              ) : (
                <ImageIcon className="h-4 w-4 text-white shrink-0" />
              )}
              <span className="truncate">{activeAttachment.name}</span>
              <span className="text-[10px] font-mono text-[#777777] shrink-0">({activeAttachment.size})</span>
            </div>
            <button onClick={() => setActiveAttachment(null)} className="p-1 hover:text-red-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-white/10 bg-[#0A0A0A]/95 p-2 sm:p-4 backdrop-blur-md z-20 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,audio/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach File"
              title="Attach photo or video"
              className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-[#141414] border border-white/10 text-[#AAAAAA] hover:text-white transition-colors"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Mobile Camera Input */}
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*"
              capture="environment"
            />
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              aria-label="Take Photo"
              title="Take Photo with Camera"
              className="flex sm:hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141414] border border-white/10 text-[#AAAAAA] hover:text-white transition-colors"
            >
              <Camera className="h-4 w-4" />
            </button>

            {/* Emoji Trigger */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(prev => !prev)}
              aria-label="Emoji Picker"
              className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
                showEmojiPicker ? 'bg-white text-black border-white' : 'bg-[#141414] border-white/10 text-[#AAAAAA] hover:text-white'
              }`}
            >
              <Smile className="h-4 w-4" />
            </button>

            {/* Voice Record Button */}
            <button
              type="button"
              onClick={handleSendSimulatedVoice}
              aria-label="Voice Note"
              className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border transition-all ${
                isRecordingVoice
                  ? 'bg-red-500 text-white border-red-500 animate-pulse'
                  : 'bg-[#141414] border-white/10 text-[#AAAAAA] hover:text-white'
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={isRecordingVoice ? 'Recording voice note...' : `Message ${partner.name}...`}
              className="clay-input flex-1 min-w-0 h-9 sm:h-11 px-3 sm:px-4 text-xs sm:text-sm font-light placeholder-[#555555]"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && !activeAttachment) || isUploadingMedia}
              className={`clay-btn h-9 sm:h-11 px-3 sm:px-5 shrink-0 rounded-full flex items-center justify-center transition-all ${
                (inputText.trim() || activeAttachment) && !isUploadingMedia
                  ? 'clay-btn-primary'
                  : 'bg-[#141414] border border-white/5 text-[#444444] cursor-not-allowed'
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Full Searchable Unicode Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-3 sm:left-6 z-50">
              <EmojiPicker
                onSelect={(emoji) => {
                  setInputText(prev => prev + emoji);
                  chatService.sendTyping(user.id);
                  if (emoji === '❤️') triggerHeartEffect();
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Info Drawer */}
      <AnimatePresence>
        {showRightInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRightInfo(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed lg:static inset-y-0 right-0 z-50 lg:z-auto w-80 max-w-[85vw] flex flex-col border-l border-white/10 bg-[#0A0A0A] p-5 sm:p-6 shrink-0 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 lg:hidden border-b border-white/10 mb-4">
                <span className="font-serif text-sm text-white font-medium">Partner Profile</span>
                <button
                  onClick={() => setShowRightInfo(false)}
                  className="p-1.5 rounded-full text-[#777777] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-center pb-6 border-b border-white/10">
                <img
                  src={partner.avatar}
                  alt={partner.name}
                  className="h-20 w-20 rounded-full mx-auto object-cover border-2 border-white/20 shadow-xl mb-3"
                />
                <h3 className="font-serif text-lg text-white font-normal">{partner.name}</h3>
                <p className="text-xs text-[#777777]">{partner.nickname}</p>
                <p className="mt-2 text-xs text-[#AAAAAA] font-light italic">
                  &ldquo;{partner.bio}&rdquo;
                </p>
              </div>

              <div className="py-4 space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#777777]">Favorite Song</span>
                  <p className="text-xs text-white mt-0.5">{partner.favoriteSong}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#777777]">Favorite Place</span>
                  <p className="text-xs text-white mt-0.5">{partner.favoritePlace}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#777777]">Shared Pinned Messages</span>
                  <p className="text-xs text-white mt-0.5">{pinnedMessages.length} saved in this chat</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* WhatsApp-Style Chat Wallpaper Customizer Modal */}
      <Modal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
        title="Chat Wallpaper"
      >
        <div className="space-y-6 pt-2 select-none">
          <p className="text-xs text-[#888888] font-light">
            Choose a romantic background wallpaper for your private sanctuary chat.
          </p>

          {/* Presets Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase text-[#AAAAAA]">Curated Presets</span>
            <div className="grid grid-cols-3 gap-2.5">
              {WALLPAPER_PRESETS.map(preset => {
                const isSelected = wallpaper.value === preset.url;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      chatService.setWallpaper({
                        type: preset.url ? 'preset' : 'color',
                        value: preset.url || '#070707',
                        opacity: wallpaper.opacity,
                        blur: wallpaper.blur,
                      });
                    }}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all p-1 ${
                      isSelected ? 'border-white scale-105 shadow-lg' : 'border-white/10 hover:border-white/40'
                    }`}
                  >
                    <div
                      className="h-20 w-full rounded-xl bg-cover bg-center flex items-end justify-center p-1.5"
                      style={{
                        backgroundImage: preset.url ? `url(${preset.preview})` : 'none',
                        backgroundColor: preset.preview.startsWith('#') ? preset.preview : '#111111',
                      }}
                    >
                      <span className="text-[10px] font-mono text-white bg-black/70 px-2 py-0.5 rounded-full line-clamp-1">
                        {preset.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Image URL or Upload */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <span className="text-[11px] font-mono uppercase text-[#AAAAAA]">Custom Background</span>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste image URL (https://...)"
                value={customWallpaperUrl}
                onChange={e => setCustomWallpaperUrl(e.target.value)}
                className="clay-input flex-1 h-9 px-3 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (!customWallpaperUrl.trim()) return;
                  chatService.setWallpaper({
                    type: 'custom',
                    value: customWallpaperUrl.trim(),
                    opacity: wallpaper.opacity,
                    blur: wallpaper.blur,
                  });
                  setCustomWallpaperUrl('');
                }}
                className="clay-btn clay-btn-primary px-3 text-xs"
              >
                Apply
              </button>
            </div>

            <div className="flex items-center justify-between">
              <input
                type="file"
                ref={wallpaperInputRef}
                onChange={handleWallpaperFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => wallpaperInputRef.current?.click()}
                className="clay-btn px-4 py-2 rounded-xl text-xs flex items-center gap-2 text-white bg-[#181818] border border-white/10 hover:bg-white hover:text-black"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload from Device
              </button>

              <button
                type="button"
                onClick={() => {
                  chatService.setWallpaper({
                    type: 'color',
                    value: '#070707',
                    opacity: 100,
                    blur: 0,
                  });
                }}
                className="text-xs text-[#777777] hover:text-white font-mono"
              >
                Reset to Default
              </button>
            </div>
          </div>

          {/* Opacity & Blur Sliders */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-[#AAAAAA]">
              <span>Wallpaper Opacity</span>
              <span className="font-mono text-white">{wallpaper.opacity ?? 100}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={wallpaper.opacity ?? 100}
              onChange={e => {
                chatService.setWallpaper({
                  ...wallpaper,
                  opacity: Number(e.target.value),
                });
              }}
              className="w-full accent-white"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
