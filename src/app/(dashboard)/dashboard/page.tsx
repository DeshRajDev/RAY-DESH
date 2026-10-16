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
import { initialMemories, initialMessages, initialStories, initialSongs, initialDates, initialBucketList, initialLetters } from '@/constants/initial-data';
import { daysUntil, formatDate, getTimeOfDayGreeting, TimeOfDayGreeting } from '@/lib/date-utils';

export default function DashboardPage() {
  const { user, partner, couple, openMediaViewer, playSong, triggerHeartEffect } = useApp();
  const [timeGreeting, setTimeGreeting] = useState<TimeOfDayGreeting>(() => getTimeOfDayGreeting());

  useEffect(() => {
    const update = () => {
      setTimeGreeting(getTimeOfDayGreeting());
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const latestMessage = initialMessages[initialMessages.length - 1];
  const nextDate = initialDates[0];
  const nextBirthday = initialDates[1];
  const completedBucketCount = initialBucketList.filter(b => b.isCompleted).length;
  const recentSong = initialSongs[0];
  const heroMemory = initialMemories[0];

  // Convert memories into Skiper6 carousel items
  const carouselItems: Skiper6Item[] = initialMemories.map(m => ({
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
            <p className="text-xs sm:text-sm text-[#777777] font-light">
              {daysUntil(nextDate.date, true)} days until <span className="text-[#CCCCCC]">{nextDate.title}</span>
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <button
              onClick={(e) => triggerHeartEffect(e.clientX, e.clientY)}
              className="text-xs text-[#AAAAAA] hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Heart className="h-3.5 w-3.5 fill-white text-white" />
              Send Rey a silent heartbeat
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
            <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-[#E5E5E5]">
              {new Date(partner.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="my-4">
            <div className="text-4xl font-serif text-white font-light">
              {daysUntil(nextBirthday.date, true)}
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
        <Skiper6 items={carouselItems} />
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
              <span className="text-[10px] font-mono text-[#555555]">
                {formatDate(latestMessage.createdAt, 'relative')}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/5 space-y-1">
              <span className="text-xs font-serif text-white">{partner.name}:</span>
              <p className="text-xs text-[#AAAAAA] font-light line-clamp-2 leading-relaxed">
                {latestMessage.content}
              </p>
            </div>
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
                {completedBucketCount} / {initialBucketList.length} Done
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden mb-4">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedBucketCount / initialBucketList.length) * 100}%` }}
              />
            </div>

            <p className="text-xs text-[#AAAAAA] font-light line-clamp-2">
              Next Goal: {initialBucketList.find(b => !b.isCompleted)?.title}
            </p>
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
              <span className="text-[10px] font-mono text-[#555555]">
                {recentSong.category}
              </span>
            </div>

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
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
            <button
              onClick={() => playSong(recentSong)}
              className="text-xs text-[#AAAAAA] hover:text-white flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Play track
            </button>
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
                Sealed
              </span>
            </div>
            <h4 className="font-serif text-sm text-white">
              &ldquo;{initialLetters[0].occasion}&rdquo;
            </h4>
            <p className="mt-1 text-xs text-[#777777] font-light">
              From {initialLetters[0].authorName} with silver wax seal
            </p>
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
              <span className="text-[10px] font-mono text-[#555555]">
                {daysUntil(nextDate.date, true)} days
              </span>
            </div>
            <h4 className="font-serif text-sm text-white">{nextDate.title}</h4>
            <p className="mt-1 text-xs text-[#777777] font-light line-clamp-2">
              {nextDate.description}
            </p>
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
