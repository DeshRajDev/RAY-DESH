'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cake,
  Sparkles,
  Gift,
  Lock,
  Plus,
  Heart,
  Star,
  Check,
  ExternalLink,
  Video,
  Play,
  Calendar,
  Eye,
  EyeOff,
  Clock,
  ShieldAlert,
  Film
} from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { BirthdayData, BirthdayPlan, BirthdayGiftWish, User } from '@/types';
import { birthdayService } from '@/services/birthday.service';
import { Modal } from '@/components/ui/modal';
import { timeUntil, formatDate, isBirthdayToday } from '@/lib/date-utils';
import { ExternalVideoEmbed } from '@/components/reels/ExternalVideoEmbed';

export default function BirthdayPage() {
  const { user, partner, triggerBirthdayCelebration, triggerHeartEffect } = useApp();
  const [bData, setBData] = useState<BirthdayData | null>(null);
  
  // Choose which person's birthday is being viewed (Default to Rey user_2 as upcoming)
  const [selectedCelebrantId, setSelectedCelebrantId] = useState<'user_1' | 'user_2'>('user_2');
  const [activeTab, setActiveTab] = useState<'surprises' | 'wishlist' | 'message'>('surprises');
  
  // Modals
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [isAddWishModalOpen, setIsAddWishModalOpen] = useState(false);
  const [activeVideoModalUrl, setActiveVideoModalUrl] = useState<string | null>(null);
  
  // Celebration preview state
  const [isCelebrationPreview, setIsCelebrationPreview] = useState(false);

  // New Plan form state
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanCat, setNewPlanCat] = useState<BirthdayPlan['category']>('Gift Idea');
  const [newPlanBudget, setNewPlanBudget] = useState('');
  const [newPlanNotes, setNewPlanNotes] = useState('');

  // New Wish form state
  const [newWishTitle, setNewWishTitle] = useState('');
  const [newWishPrice, setNewWishPrice] = useState('');
  const [newWishDesc, setNewWishDesc] = useState('');
  const [newWishLink, setNewWishLink] = useState('');
  const [newWishPhoto, setNewWishPhoto] = useState('');
  const [newWishVideo, setNewWishVideo] = useState('');

  useEffect(() => {
    birthdayService.getBirthdayData().then(res => setBData(res.data ?? null));
    const unsubscribe = birthdayService.subscribe(updated => setBData(updated));
    return () => unsubscribe();
  }, []);

  // Determine celebrant & planner user objects
  const celebrant: User = useMemo(() => {
    if (selectedCelebrantId === user.id) return user;
    return partner;
  }, [selectedCelebrantId, user, partner]);

  const planner: User = useMemo(() => {
    if (selectedCelebrantId === user.id) return partner;
    return user;
  }, [selectedCelebrantId, user, partner]);

  // Is current logged in user the celebrant or the planner?
  const isCurrentUserCelebrant = user.id === selectedCelebrantId;
  const isCurrentUserPlanner = user.id !== selectedCelebrantId;

  // Birthday date calculation
  const birthdayDateStr = celebrant.birthday;
  const isToday = isBirthdayToday(birthdayDateStr);
  const countdown = timeUntil(birthdayDateStr, true);

  // Unlocked condition:
  // Surprises & secret messages are visible IF:
  // 1. Today is the actual birthday, OR
  // 2. Logged in user is the planner (preparing secrets), OR
  // 3. Planner activated celebration preview mode
  const isSurpriseUnlocked = isToday || isCelebrationPreview || isCurrentUserPlanner;

  // Filter plans and wishes for the selected celebrant
  const celebrantPlans = useMemo(() => {
    if (!bData) return [];
    return bData.plans.filter(p => !p.forUserId || p.forUserId === celebrant.id);
  }, [bData, celebrant.id]);

  const celebrantWishes = useMemo(() => {
    if (!bData) return [];
    return bData.wishes.filter(w => !w.forUserId || w.forUserId === celebrant.id);
  }, [bData, celebrant.id]);

  if (!bData) return null;

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    await birthdayService.addPlan({
      forUserId: celebrant.id,
      title: newPlanTitle.trim(),
      category: newPlanCat,
      budget: newPlanBudget.trim() || undefined,
      notes: newPlanNotes.trim() || undefined,
      status: 'planned',
      secret: true,
      addedById: user.id,
      createdAt: new Date().toISOString(),
    });

    setIsAddPlanModalOpen(false);
    setNewPlanTitle('');
    setNewPlanBudget('');
    setNewPlanNotes('');
  };

  const handleAddWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishTitle.trim()) return;

    await birthdayService.addWish({
      forUserId: celebrant.id,
      addedById: user.id,
      title: newWishTitle.trim(),
      description: newWishDesc.trim(),
      price: newWishPrice.trim() || undefined,
      link: newWishLink.trim() || undefined,
      photoUrl: newWishPhoto.trim() || undefined,
      videoUrl: newWishVideo.trim() || undefined,
      isClaimed: false,
      createdAt: new Date().toISOString(),
    });

    setIsAddWishModalOpen(false);
    setNewWishTitle('');
    setNewWishPrice('');
    setNewWishDesc('');
    setNewWishLink('');
    setNewWishPhoto('');
    setNewWishVideo('');
  };

  const handleToggleClaim = async (wishId: string) => {
    await birthdayService.toggleClaimWish(wishId);
    triggerHeartEffect();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 space-y-8 select-none">
      {/* 1. Top Header & Celebrant Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <Cake className="h-3.5 w-3.5 text-white" />
            <span>Celebration &amp; Wishlist Vault</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">
            Birthday Experience
          </h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            {isCurrentUserCelebrant
              ? `Your personal birthday countdown and wishlist hub`
              : `Secret surprise planning, gift ideas, and wishlist for ${celebrant.name}`}
          </p>
        </div>

        {/* Celebrant Switcher Pills */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#121212] border border-white/10 shrink-0">
          <button
            onClick={() => setSelectedCelebrantId('user_2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedCelebrantId === 'user_2'
                ? 'bg-white text-black shadow-md'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            {"Rey's Birthday (Nov 1)"}
          </button>
          <button
            onClick={() => setSelectedCelebrantId('user_1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedCelebrantId === 'user_1'
                ? 'bg-white text-black shadow-md'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            {"Desh's Birthday (May 15)"}
          </button>
        </div>
      </div>

      {/* 2. Hero Countdown / Celebration Banner */}
      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#181818] via-[#101010] to-[#080808] p-6 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden">
        <div className="space-y-3 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-mono text-white border border-white/15">
            <Star className="h-3 w-3 text-white fill-white" />
            <span>
              {isToday
                ? '🎉 TODAY IS THE BIG DAY! 🎉'
                : `Next Birthday: ${formatDate(celebrant.birthday, 'short')}`}
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl text-white font-light tracking-tight">
            {isToday
              ? `Happy Birthday, ${celebrant.name}! ❤️`
              : isCurrentUserCelebrant
              ? 'Your Birthday is Coming!'
              : `${celebrant.name}'s Birthday Countdown`}
          </h2>

          <p className="text-xs sm:text-sm text-[#AAAAAA] font-light max-w-md leading-relaxed">
            {isToday
              ? `All surprise gifts and love letters are now unlocked for ${celebrant.name}!`
              : isCurrentUserCelebrant
              ? `Surprises and special love notes prepared by ${planner.name} are kept hidden until your special day.`
              : `All secret surprise plans and gifts are kept safe so they stay a beautiful surprise for ${celebrant.name}.`}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
            <button
              onClick={() => triggerBirthdayCelebration(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-black text-xs font-medium shadow-[0_4px_14px_rgba(255,255,255,0.2)] hover:bg-[#E5E5E5] transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Celebrate Now</span>
            </button>
          </div>
        </div>

        {/* Live Countdown Grid */}
        <div className="grid grid-cols-3 gap-3 shrink-0 z-10">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#111111]/90 border border-white/10 p-4 w-24 shadow-inner">
            <span className="text-3xl font-serif text-white font-light">{countdown.days}</span>
            <span className="text-[10px] uppercase font-mono text-[#777777] mt-1">Days</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#111111]/90 border border-white/10 p-4 w-24 shadow-inner">
            <span className="text-3xl font-serif text-white font-light">{countdown.hours}</span>
            <span className="text-[10px] uppercase font-mono text-[#777777] mt-1">Hours</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#111111]/90 border border-white/10 p-4 w-24 shadow-inner">
            <span className="text-3xl font-serif text-white font-light">{countdown.minutes}</span>
            <span className="text-[10px] uppercase font-mono text-[#777777] mt-1">Minutes</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('surprises')}
            className={`px-4 py-2 rounded-2xl text-xs font-medium transition-all ${
              activeTab === 'surprises'
                ? 'bg-white text-black shadow-md'
                : 'bg-[#121212] text-[#888888] hover:text-white border border-white/5'
            }`}
          >
            Secret Surprises {!isSurpriseUnlocked ? '🔒' : `(${celebrantPlans.length})`}
          </button>
          
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-4 py-2 rounded-2xl text-xs font-medium transition-all ${
              activeTab === 'wishlist'
                ? 'bg-white text-black shadow-md'
                : 'bg-[#121212] text-[#888888] hover:text-white border border-white/5'
            }`}
          >
            Gift Wishlist ({celebrantWishes.length})
          </button>

          <button
            onClick={() => setActiveTab('message')}
            className={`px-4 py-2 rounded-2xl text-xs font-medium transition-all ${
              activeTab === 'message'
                ? 'bg-white text-black shadow-md'
                : 'bg-[#121212] text-[#888888] hover:text-white border border-white/5'
            }`}
          >
            Love Letter {!isSurpriseUnlocked ? '💌 🔒' : '💌'}
          </button>
        </div>

        {/* Action Button depending on Role and Active Tab */}
        <div>
          {activeTab === 'surprises' && isCurrentUserPlanner && (
            <button
              onClick={() => setIsAddPlanModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white text-black text-xs font-medium shadow-md hover:bg-[#E5E5E5] transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Secret Surprise</span>
            </button>
          )}

          {activeTab === 'wishlist' && (
            <button
              onClick={() => setIsAddWishModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white text-black text-xs font-medium shadow-md hover:bg-[#E5E5E5] transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isCurrentUserCelebrant ? 'Add to My Wishlist' : 'Add Wish for Partner'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Tab Content */}
      <div className="pt-2">
        {/* TAB 1: SECRET SURPRISES */}
        {activeTab === 'surprises' && (
          <div>
            {!isSurpriseUnlocked ? (
              /* LOCKED STATE FOR CELEBRANT */
              <div className="p-8 sm:p-12 rounded-3xl bg-[#0F0F0F] border border-white/10 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#181818] border border-white/15 text-white shadow-lg">
                  <Lock className="h-8 w-8 text-white animate-pulse" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-white font-normal">
                  Secret Surprises Locked Until Birthday Day
                </h3>
                <p className="text-xs sm:text-sm text-[#888888] font-light max-w-md leading-relaxed">
                  {planner.name} is currently preparing secret gifts, places to visit, and special moments for your birthday on {formatDate(celebrant.birthday, 'short')}. 
                  All surprise details will unlock automatically on your special day!
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#AAAAAA]">
                  <Clock className="h-3.5 w-3.5 text-white" />
                  <span>Unlocks in {countdown.days} days, {countdown.hours} hours</span>
                </div>
              </div>
            ) : (
              /* UNLOCKED SURPRISES VIEW */
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-[#AAAAAA]">
                  <Lock className="h-3.5 w-3.5 text-white shrink-0" />
                  <span>
                    {isCurrentUserPlanner
                      ? `These surprise plans are strictly hidden from ${celebrant.name} until their birthday arrives.`
                      : `🎉 Unlocked for your birthday celebration! Enjoy every moment planned with love.`}
                  </span>
                </div>

                {celebrantPlans.length === 0 ? (
                  <div className="p-12 text-center text-xs text-[#666666] font-light">
                    No secret surprise plans added yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {celebrantPlans.map(plan => (
                      <div
                        key={plan.id}
                        className="p-6 rounded-3xl border border-white/10 bg-[#0F0F0F] flex flex-col justify-between space-y-4 shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-white/20 transition-all"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                              {plan.category}
                            </span>
                            {plan.budget && isCurrentUserPlanner && (
                              <span className="text-xs font-mono text-[#AAAAAA]">
                                Budget: {plan.budget}
                              </span>
                            )}
                          </div>
                          <h3 className="font-serif text-lg text-white font-normal">{plan.title}</h3>
                          {plan.notes && (
                            <p className="text-xs text-[#888888] font-light leading-relaxed">
                              {plan.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs font-mono">
                          <span className="text-[#888888] uppercase">
                            Status: <strong className="text-white font-medium">{plan.status}</strong>
                          </span>
                          {isCurrentUserPlanner && (
                            <button
                              onClick={() => {
                                const nextStatus =
                                  plan.status === 'idea'
                                    ? 'planned'
                                    : plan.status === 'planned'
                                    ? 'purchased'
                                    : 'completed';
                                birthdayService.togglePlanStatus(plan.id, nextStatus);
                              }}
                              className="text-white hover:underline"
                            >
                              Update Status →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GIFTS & WISHLIST */}
        {activeTab === 'wishlist' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-[#AAAAAA]">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-white" />
                <span>
                  {isCurrentUserCelebrant
                    ? `Add things you love! You can add links, pictures, and video links (Instagram Reels/TikTok).`
                    : `Wishlist items saved by ${celebrant.name}. You can claim items secretly so they remain a surprise.`}
                </span>
              </div>
            </div>

            {celebrantWishes.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#666666] font-light">
                No items in the wishlist yet. Click &apos;Add to Wishlist&apos; to save items.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {celebrantWishes.map(wish => {
                  const isClaimedByPartner = Boolean(wish.isClaimed);

                  return (
                    <div
                      key={wish.id}
                      className="p-6 rounded-3xl border border-white/10 bg-[#0F0F0F] flex flex-col justify-between space-y-4 shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-white/20 transition-all"
                    >
                      <div className="space-y-3">
                        {/* Photo or Video preview if attached */}
                        {wish.photoUrl && (
                          <div className="w-full h-44 rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                            <img
                              src={wish.photoUrl}
                              alt={wish.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-serif text-lg text-white font-normal">{wish.title}</h3>
                            {wish.price && (
                              <span className="text-xs font-mono text-[#AAAAAA]">{wish.price}</span>
                            )}
                          </div>

                          {/* Video Format Badge */}
                          {wish.videoUrl && (
                            <button
                              onClick={() => setActiveVideoModalUrl(wish.videoUrl!)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-[11px] font-mono text-white hover:bg-white hover:text-black transition-all shrink-0"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span>Watch Video</span>
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-[#888888] font-light leading-relaxed">
                          {wish.description}
                        </p>

                        {/* Product URL */}
                        {wish.link && (
                          <a
                            href={wish.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-white hover:underline pt-1"
                          >
                            <span>Open Store Link</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      {/* Footer Claim Actions (Only Planner sees the Secret Claim toggle so celebrant isn't spoiled) */}
                      {isCurrentUserPlanner && (
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <button
                            onClick={() => handleToggleClaim(wish.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                              isClaimedByPartner
                                ? 'bg-white text-black shadow-md'
                                : 'bg-[#181818] border border-white/10 text-[#AAAAAA] hover:text-white'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>
                              {isClaimedByPartner ? 'Claimed Secretly ❤️' : 'Claim Secretly'}
                            </span>
                          </button>

                          <span className="text-[11px] font-mono text-[#666666]">
                            {isClaimedByPartner ? 'Marked for purchase' : 'Not yet claimed'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SECRET LOVE LETTER */}
        {activeTab === 'message' && (
          <div>
            {!isSurpriseUnlocked ? (
              /* LOCKED LETTER STATE */
              <div className="p-8 sm:p-12 rounded-3xl bg-[#0F0F0F] border border-white/10 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#181818] border border-white/15 text-white shadow-lg">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-white font-normal">
                  Birthday Love Letter is Sealed
                </h3>
                <p className="text-xs sm:text-sm text-[#888888] font-light max-w-md leading-relaxed">
                  A personal birthday letter written by {planner.name} is sealed with silver wax and will automatically unlock for you on {formatDate(celebrant.birthday, 'short')}.
                </p>
              </div>
            ) : (
              /* UNLOCKED LETTER */
              <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#141414] to-[#0A0A0A] border border-white/10 space-y-6 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                    <Heart className="h-5 w-5 fill-black" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-white">Birthday Letter for {celebrant.name}</h3>
                    <p className="text-xs font-mono text-[#777777]">Written by {planner.name}</p>
                  </div>
                </div>

                <p className="font-serif text-base sm:text-lg text-[#E5E5E5] font-light leading-relaxed italic">
                  &ldquo;{selectedCelebrantId === 'user_2' ? bData.specialMessageForPartner : bData.specialMessageFromPartner}&rdquo;
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-[#777777] font-mono">
                  <span>Forever &amp; Always</span>
                  <span>Desh &amp; Rey Sanctuary</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: ADD SURPRISE PLAN (PLANNER ONLY) */}
      <Modal
        isOpen={isAddPlanModalOpen}
        onClose={() => setIsAddPlanModalOpen(false)}
        title={`Add Secret Surprise for ${celebrant.name}`}
        description="Plan a gift, surprise getaway, reservation, or activity hidden from partner."
      >
        <form onSubmit={handleAddPlan} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#AAAAAA]">Title *</label>
            <input
              type="text"
              required
              value={newPlanTitle}
              onChange={e => setNewPlanTitle(e.target.value)}
              placeholder="e.g. Private Starlit Igloo Dinner"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#AAAAAA]">Category</label>
              <select
                value={newPlanCat}
                onChange={e => setNewPlanCat(e.target.value as BirthdayPlan['category'])}
                className="w-full px-3 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30 transition-all"
              >
                <option value="Gift Idea">Gift Idea</option>
                <option value="Surprise">Surprise</option>
                <option value="Place to Visit">Place to Visit</option>
                <option value="Activity">Activity</option>
                <option value="Message/Card">Message/Card</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#AAAAAA]">Budget</label>
              <input
                type="text"
                value={newPlanBudget}
                onChange={e => setNewPlanBudget(e.target.value)}
                placeholder="$150"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#AAAAAA]">Secret Notes &amp; Hiding Place</label>
            <textarea
              value={newPlanNotes}
              onChange={e => setNewPlanNotes(e.target.value)}
              placeholder="Where it's hidden or booking reservation notes..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsAddPlanModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#161616] border border-white/10 text-xs text-[#888888] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-[#E5E5E5] transition-all"
            >
              Save Secret Surprise
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADD WISHLIST ITEM */}
      <Modal
        isOpen={isAddWishModalOpen}
        onClose={() => setIsAddWishModalOpen(false)}
        title="Add to Birthday Wishlist"
        description="Save an item you love or would love to receive, with links, pictures, or video."
      >
        <form onSubmit={handleAddWish} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#AAAAAA]">Item Name *</label>
            <input
              type="text"
              required
              value={newWishTitle}
              onChange={e => setNewWishTitle(e.target.value)}
              placeholder="e.g. FujiFilm Instax Instant Camera"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#AAAAAA]">Approximate Price</label>
              <input
                type="text"
                value={newWishPrice}
                onChange={e => setNewWishPrice(e.target.value)}
                placeholder="$120"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#AAAAAA]">Store / Website Link</label>
              <input
                type="url"
                value={newWishLink}
                onChange={e => setNewWishLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#AAAAAA]">Photo URL</label>
              <input
                type="url"
                value={newWishPhoto}
                onChange={e => setNewWishPhoto(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#AAAAAA]">Video URL (Reel / TikTok)</label>
              <input
                type="url"
                value={newWishVideo}
                onChange={e => setNewWishVideo(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#AAAAAA]">Description / Color / Model</label>
            <textarea
              value={newWishDesc}
              onChange={e => setNewWishDesc(e.target.value)}
              placeholder="Specific color, size, edition, or details..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white/30 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsAddWishModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#161616] border border-white/10 text-xs text-[#888888] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-[#E5E5E5] transition-all"
            >
              Add to Wishlist
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: VIDEO PREVIEW MODAL */}
      <Modal
        isOpen={Boolean(activeVideoModalUrl)}
        onClose={() => setActiveVideoModalUrl(null)}
        title="Wishlist Video Item"
        description="Official embedded video demonstration."
      >
        <div className="py-2 flex justify-center">
          {activeVideoModalUrl && (
            <div className="w-full max-w-sm">
              <ExternalVideoEmbed
                url={activeVideoModalUrl}
                autoLoad={true}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
