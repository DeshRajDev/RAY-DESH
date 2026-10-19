'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Sparkles, 
  MessageCircle, 
  Camera, 
  Calendar, 
  Cake, 
  CheckSquare, 
  Music, 
  Compass, 
  Mail, 
  ArrowRight, 
  Play, 
  MapPin, 
  Clock 
} from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { RelationshipTimer } from '@/components/ui/relationship-timer';
import { Skiper6, Skiper6Item } from '@/components/ui/skiper6';
import { Skeleton } from '@/components/ui/skeleton';
import { daysUntil, formatDate, getTimeOfDayGreeting, TimeOfDayGreeting } from '@/lib/date-utils';
import { chatService } from '@/services/chat.service';
import { memoryService } from '@/services/memory.service';
import { bucketListService } from '@/services/bucketList.service';
import { dateService } from '@/services/date.service';
import { musicService } from '@/services/music.service';
import { letterService } from '@/services/letter.service';
import { Memory, Message, DateEvent, BucketListItem, Song, LoveLetter } from '@/types';

export default function DashboardPage() {
  const { user, partner, couple, openMediaViewer, playSong, triggerHeartEffect } = useApp();
  const [timeGreeting, setTimeGreeting] = useState<TimeOfDayGreeting>(() => getTimeOfDayGreeting());
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [dates, setDates] = useState<DateEvent[]>([]);
  const [bucketList, setBucketList] = useState<BucketListItem[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [letters, setLetters] = useState<LoveLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const update = () => {
      setTimeGreeting(getTimeOfDayGreeting());
    };
    update();
    const interval = setInterval(update, 30000);

    Promise.allSettled([
      chatService.getMessages().then(res => setMessages(res.data ?? [])),
      memoryService.getMemories().then(res => setMemories(res.data ?? [])),
      dateService.getDates().then(res => setDates(res.data ?? [])),
      bucketListService.getItems().then(res => setBucketList(res.data ?? [])),
      musicService.getSongs().then(res => setSongs(res.data ?? [])),
      letterService.getLetters().then(res => setLetters(res.data ?? [])),
    ]).finally(() => {
      setIsLoading(false);
    });

    const unsubChat = chatService.subscribe(setMessages);
    const unsubMemories = memoryService.subscribe(setMemories);
    const unsubDates = dateService.subscribe(setDates);
    const unsubBucket = bucketListService.subscribe(setBucketList);
    const unsubSongs = musicService.subscribe(setSongs);
    const unsubLetters = letterService.subscribe(setLetters);

    return () => {
      clearInterval(interval);
      unsubChat();
      unsubMemories();
      unsubDates();
      unsubBucket();
      unsubSongs();
      unsubLetters();
    };
  }, []);

  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const nextDate = dates.length > 0 ? dates[0] : null;
  const nextBirthday = partner.birthday ? { date: partner.birthday, title: `${partner.name}'s Birthday` } : null;
  const totalBucket = bucketList.length;
  const completedBucketCount = bucketList.filter(b => b.isCompleted).length;
  const nextGoal = bucketList.find(b => !b.isCompleted)?.title || null;
  const recentSong = songs.length > 0 ? songs[0] : null;
  const latestLetter = letters.length > 0 ? letters[0] : null;
  const activeMemories = memories;

  // Convert memories into Skiper6 carousel items
  const carouselItems: Skiper6Item[] = activeMemories.slice(0, 8).map(m => ({
    id: m.id,
    title: m.title,
    subtitle: m.location,
    category: m.category,
    image: m.coverUrl,
    description: m.description,
    badge: formatDate(m.date, 'short'),
    onClick: () => openMediaViewer(m.mediaUrls, 0, {
      title: m.title,
      description: m.description,
      location: m.location,
      date: formatDate(m.date, 'medium')
    })
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8 py-6 space-y-8">
      {/* 1. HERO SECTION & LIVE RELATIONSHIP TIMER */}
      <section className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0A0A0A] p-6 sm:p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden">
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 right-1/4 h-56 w-56 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#AAAAAA] uppercase tracking-widest mb-1.5">
              <span>Private Digital Home</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Both Connected
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-white font-light tracking-tight">
              {timeGreeting.greeting}, {user.name} {timeGreeting.emoji}
            </h1>
            <p className="mt-1 text-sm text-[#777777] font-light">
              {timeGreeting.subtext} • You &amp; {partner.name} in our sanctuary
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-medium flex items-center gap-2"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Open Chat
            </Link>
            <Link
              href="/memories"
              className="clay-btn clay-btn-secondary px-5 py-2.5 text-xs font-medium flex items-center gap-2"
            >
              <Camera className="h-3.5 w-3.5" />
              Vault
            </Link>
          </div>
        </div>

        {/* Live Relationship Clock */}
        <div className="pt-6">
          <RelationshipTimer startDate={couple.relationshipStartDate} />
        </div>
      </section>

      {/* 2. TODAY'S MOMENT & DAILY REFLECTION */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-3xl border border-white/10 bg-[#0F0F0F] p-6 sm:p-8 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#777777]">Today&apos;s Sanctuary Moment</span>
            </div>
            <span className="text-xs font-mono text-[#AAAAAA]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="my-6 space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl text-white font-light leading-snug">
              &ldquo;Every single ordinary second with you turns into an extraordinary memory.&rdquo;
            </h2>
            {nextDate ? (
              <p className="text-xs sm:text-sm text-[#777777] font-light">
                {daysUntil(nextDate.date, true)} days until <span className="text-[#CCCCCC]">{nextDate.title}</span>
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-[#777777] font-light">
                A peaceful moment together in our private sanctuary
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <button
              onClick={(e) => triggerHeartEffect(e.clientX, e.clientY)}
              className="text-xs text-[#AAAAAA] hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Heart className="h-3.5 w-3.5 fill-white text-white" />
              Send {partner.name} a silent heartbeat
            </button>
            <Link href="/journal" className="text-xs text-[#AAAAAA] hover:text-white flex items-center gap-1">
              Read Daily Journal <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Next Birthday Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0F0F0F] p-6 sm:p-8 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cake className="h-4 w-4 text-white" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#777777]">Next Birthday</span>
            </div>
            {partner.birthday && (
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-[#E5E5E5]">
                {new Date(partner.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

          <div className="my-4">
            <div className="text-4xl font-serif text-white font-light">
              {nextBirthday ? daysUntil(nextBirthday.date, true) : '—'}
            </div>
            <div className="text-xs uppercase font-mono tracking-widest text-[#777777] mt-1">
              Days Remaining for {partner.name}
            </div>
            <p className="mt-3 text-xs text-[#888888] font-light">
              Secret surprises and gift ideas saved in vault.
            </p>
          </div>

          <Link
            href="/birthday"
            className="clay-btn clay-btn-secondary w-full py-2.5 text-xs text-center"
          >
            View Birthday Hub
          </Link>
        </div>
      </section>

      {/* 3. SKIPER 6 INTERACTIVE FEATURED MOMENTS CAROUSEL */}
      <section className="rounded-3xl border border-white/10 bg-[#0B0B0B] p-6 sm:p-8 shadow-md">
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden py-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-60 rounded-3xl shrink-0" />
            ))}
          </div>
        ) : carouselItems.length > 0 ? (
          <Skiper6 items={carouselItems} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <Camera className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg text-white">Our Memory Vault</h3>
            <p className="text-xs text-[#777777] max-w-sm mx-auto font-light leading-relaxed">
              Preserve your first shared photo, date, or milestone to display here in your sanctuary carousel.
            </p>
            <Link href="/memories" className="clay-btn clay-btn-secondary px-4 py-2 text-xs">
              Capture First Memory
            </Link>
          </div>
        )}
      </section>

      {/* 4. MULTI-MODULE DASHBOARD TILES */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Latest Chat Conversation Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0F0F0F] p-6 flex flex-col justify-between shadow-md hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-white" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#777777]">Latest Conversation</span>
              </div>
              {latestMessage && (
                <span className="text-[10px] font-mono text-[#555555]">
                  {formatDate(latestMessage.createdAt, 'relative')}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            ) : latestMessage ? (
              <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/5 space-y-1">
                <span className="text-xs font-serif text-white">{partner.name}:</span>
                <p className="text-xs text-[#AAAAAA] font-light line-clamp-2 leading-relaxed">
                  {latestMessage.content}
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/5">
                <p className="text-xs text-[#777777] font-light">
                  No messages yet. Send a whisper to {partner.name} in chat.
                </p>
              </div>
            )}
          </div>

          <Link
            href="/chat"
            className="mt-4 flex items-center justify-between text-xs text-[#888888] hover:text-white pt-3 border-t border-white/5 transition-colors"
          >
            <span>Continue private chat</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Bucket List Progress Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0F0F0F] p-6 flex flex-col justify-between shadow-md hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-white" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#777777]">Bucket List</span>
              </div>
              <span className="text-xs font-mono text-white">
                {completedBucketCount} / {totalBucket} Done
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3 p-2">
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
            ) : (
              <>
                {/* Visual Progress Bar */}
                <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden mb-4">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalBucket > 0 ? (completedBucketCount / totalBucket) * 100 : 0}%` }}
                  />
                </div>

                <p className="text-xs text-[#AAAAAA] font-light line-clamp-2">
                  Next Goal: {nextGoal || 'Add a new couple goal to our bucket list'}
                </p>
              </>
            )}
          </div>

          <Link
            href="/bucket-list"
            className="mt-4 flex items-center justify-between text-xs text-[#888888] hover:text-white pt-3 border-t border-white/5 transition-colors"
          >
            <span>Explore our dreams</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Shared Music Mini Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0F0F0F] p-6 flex flex-col justify-between shadow-md hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-white" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#777777]">Our Songs</span>
              </div>
              {recentSong && (
                <span className="text-[10px] font-mono text-[#555555]">
                  {recentSong.category}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center gap-3 p-2">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
            ) : recentSong ? (
              <div className="flex items-center gap-3">
                <img
                  src={recentSong.coverUrl}
                  alt={recentSong.title}
                  className="h-12 w-12 rounded-2xl object-cover border border-white/10 shadow-md"
                />
                <div className="min-w-0">
                  <h4 className="font-serif text-sm text-white line-clamp-1">{recentSong.title}</h4>
                  <p className="text-xs text-[#777777] font-light line-clamp-1">{recentSong.artist}</p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/5">
                <p className="text-xs text-[#777777] font-light">
                  Add your favorite tracks to our music lounge.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
            {recentSong ? (
              <button
                onClick={() => playSong(recentSong)}
                className="text-xs text-[#AAAAAA] hover:text-white flex items-center gap-1.5"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Play track
              </button>
            ) : <span />}
            <Link href="/music" className="text-xs text-[#777777] hover:text-white">
              All music →
            </Link>
          </div>
        </div>

        {/* Digital Love Letters Preview Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0F0F0F] p-6 flex flex-col justify-between shadow-md hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-white" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#777777]">Love Letters</span>
              </div>
              <span className="text-[10px] font-mono text-white bg-white/10 px-2 py-0.5 rounded-full">
                Vault
              </span>
            </div>
            {isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-3 w-3/4 rounded-md" />
              </div>
            ) : latestLetter ? (
              <>
                <h4 className="font-serif text-sm text-white">
                  &ldquo;{latestLetter.occasion}&rdquo;
                </h4>
                <p className="mt-1 text-xs text-[#777777] font-light">
                  From {latestLetter.authorName} with {latestLetter.waxSealColor || 'silver'} seal
                </p>
              </>
            ) : (
              <>
                <h4 className="font-serif text-sm text-white">No letters sealed yet</h4>
                <p className="mt-1 text-xs text-[#777777] font-light">
                  Leave an unsealed or locked love letter for {partner.name}
                </p>
              </>
            )}
          </div>

          <Link
            href="/letters"
            className="mt-4 flex items-center justify-between text-xs text-[#888888] hover:text-white pt-3 border-t border-white/5 transition-colors"
          >
            <span>Open letters vault</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Upcoming Special Date Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0F0F0F] p-6 flex flex-col justify-between shadow-md hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-white" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#777777]">Upcoming Milestone</span>
              </div>
              {nextDate && (
                <span className="text-[10px] font-mono text-[#555555]">
                  {daysUntil(nextDate.date, true)} days
                </span>
              )}
            </div>
            {isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-3 w-3/4 rounded-md" />
              </div>
            ) : nextDate ? (
              <>
                <h4 className="font-serif text-sm text-white">{nextDate.title}</h4>
                <p className="mt-1 text-xs text-[#777777] font-light line-clamp-2">
                  {nextDate.description}
                </p>
              </>
            ) : (
              <>
                <h4 className="font-serif text-sm text-white">No upcoming dates</h4>
                <p className="mt-1 text-xs text-[#777777] font-light">
                  Plan your next date, anniversary, or special moment together
                </p>
              </>
            )}
          </div>

          <Link
            href="/dates"
            className="mt-4 flex items-center justify-between text-xs text-[#888888] hover:text-white pt-3 border-t border-white/5 transition-colors"
          >
            <span>View all dates</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Our Travel Section Preview */}
        <div className="rounded-3xl border border-white/10 bg-[#0F0F0F] p-6 flex flex-col justify-between shadow-md hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-white" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#777777]">Next Adventure</span>
              </div>
              <span className="text-[10px] font-mono text-[#555555]">Planning</span>
            </div>
            <h4 className="font-serif text-sm text-white">Amalfi Coast Clifftop Escapade</h4>
            <p className="mt-1 text-xs text-[#777777] font-light">
              Positano, Amalfi &amp; Capri, Italy
            </p>
          </div>

          <Link
            href="/trips"
            className="mt-4 flex items-center justify-between text-xs text-[#888888] hover:text-white pt-3 border-t border-white/5 transition-colors"
          >
            <span>View travel journal</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>
    </div>
  );
}
