'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, Heart, Cake, Music, Star, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '@/stores/app-context';
import { birthdayService } from '@/services/birthday.service';
import { BirthdayData } from '@/types';

export function BirthdayCelebration() {
  const { isBirthdayActive, isBirthdayPreview, dismissBirthdayCelebration, couple, triggerHeartEffect } = useApp();
  const [isGiftOpened, setIsGiftOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<'wishes' | 'secrets' | 'story'>('wishes');
  const [birthdayData, setBirthdayData] = useState<BirthdayData | null>(null);

  useEffect(() => {
    birthdayService.getBirthdayData().then(res => setBirthdayData(res.data ?? null));
    const unsub = birthdayService.subscribe(setBirthdayData);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isBirthdayActive) {
      // Monochrome and silver confetti burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#aaaaaa', '#777777', '#333333', '#ededed'],
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ffffff', '#cccccc', '#666666'],
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ffffff', '#cccccc', '#666666'],
        });
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isBirthdayActive]);

  if (!isBirthdayActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-start p-4 sm:p-8"
      >
        {/* Top bar */}
        <div className="w-full max-w-3xl flex items-center justify-between pb-6 border-b border-white/10 z-20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg">
              <Cake className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl text-white tracking-wide">
                Happy Birthday, {couple.partner2.name}! 🎂
              </h2>
              <p className="text-[11px] font-mono text-[#777777]">
                {isBirthdayPreview ? 'Birthday Celebration Preview Mode' : "Today is our queen's day ✨"}
              </p>
            </div>
          </div>

          <button
            onClick={dismissBirthdayCelebration}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A1A] border border-white/15 text-white hover:bg-white hover:text-black transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Hero Celebration Card */}
        <div className="w-full max-w-3xl mt-6 space-y-6">
          {/* Main Hero Envelope / Gift */}
          <div className="relative rounded-3xl border border-white/15 bg-gradient-to-b from-[#181818] to-[#0A0A0A] p-6 sm:p-10 text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden">
            {/* Ambient starlight glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                onClick={() => {
                  setIsGiftOpened(true);
                  confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.5 },
                    colors: ['#ffffff', '#dddddd', '#888888'],
                  });
                }}
                className="cursor-pointer mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-b from-[#252525] to-[#121212] border border-white/20 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-95 transition-transform group"
              >
                <Gift className="h-10 w-10 text-white group-hover:rotate-12 transition-transform" />
              </motion.div>

              <span className="text-xs uppercase font-mono tracking-widest text-[#AAAAAA] mb-2">
                A Special Gift from {couple.partner1.name}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-white font-light tracking-tight max-w-md">
                Another year brighter, bolder, and more beautiful.
              </h1>

              <p className="mt-4 text-sm sm:text-base text-[#AAAAAA] max-w-lg leading-relaxed font-light italic">
                &ldquo;{birthdayData?.specialMessageForPartner || 'Thank you for being my constant light and greatest adventure.'}&rdquo;
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    confetti({
                      particleCount: 70,
                      spread: 70,
                      colors: ['#ffffff', '#999999'],
                    });
                    triggerHeartEffect();
                  }}
                  className="clay-btn clay-btn-primary px-6 py-2.5 text-xs sm:text-sm font-medium flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Shower with Confetti & Hearts
                </button>
              </div>
            </div>
          </div>

          {/* Unboxed Surprise Card if opened */}
          <AnimatePresence>
            {isGiftOpened && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20 }}
                className="rounded-3xl border border-white/20 bg-[#141414] p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] text-left"
              >
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#AAAAAA] mb-3">
                  <Star className="h-4 w-4 text-white" />
                  <span>Unsealed Surprise Voucher</span>
                </div>
                <h3 className="font-serif text-2xl text-white font-normal">
                  All-Expenses Starlit Dinner & Mountain Cabin Weekend 🏔️
                </h3>
                <p className="mt-2 text-sm text-[#888888] leading-relaxed">
                  Valid anytime this winter. Includes private chef breakfast, cozy woodstove nights, and unlimited warm cuddles.
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#777777]">
                  <span>VOUCHER CODE: FOREVER-US-2026</span>
                  <span>CLAIMED WITH LOVE ❤️</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Birthday Planner & Wishlist Tab Section */}
          <div className="rounded-3xl border border-white/10 bg-[#0F0F0F] p-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <button
                onClick={() => setActiveTab('wishes')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === 'wishes'
                    ? 'bg-white text-black'
                    : 'text-[#777777] hover:text-white'
                }`}
              >
                Gift Wishlist ({birthdayData?.wishes?.length ?? 0})
              </button>
              <button
                onClick={() => setActiveTab('secrets')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === 'secrets'
                    ? 'bg-white text-black'
                    : 'text-[#777777] hover:text-white'
                }`}
              >
                Secret Plans ({birthdayData?.plans?.length ?? 0})
              </button>
            </div>

            <div className="pt-4 space-y-3">
              {activeTab === 'wishes' && (
                (birthdayData?.wishes?.length ?? 0) === 0 ? (
                  <p className="text-xs text-[#777777] text-center py-6">No gift wishes on the list yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {birthdayData?.wishes.map(wish => (
                      <div
                        key={wish.id}
                        className="rounded-2xl border border-white/10 bg-[#161616] p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif text-sm text-white">{wish.title}</h4>
                            <span className="text-xs font-mono text-[#AAAAAA]">{wish.price}</span>
                          </div>
                          <p className="mt-1 text-xs text-[#777777] font-light leading-relaxed">
                            {wish.description}
                          </p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${
                            wish.isClaimed
                              ? 'bg-white/10 text-white'
                              : 'bg-white/5 text-[#777777]'
                          }`}>
                            {wish.isClaimed ? `Claimed by ${couple.partner1.name}` : 'Available'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'secrets' && (
                (birthdayData?.plans?.length ?? 0) === 0 ? (
                  <p className="text-xs text-[#777777] text-center py-6">No secret plans added yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {birthdayData?.plans.map(plan => (
                      <div
                        key={plan.id}
                        className="rounded-2xl border border-white/10 bg-[#161616] p-4 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded-full text-[#E5E5E5]">
                              {plan.category}
                            </span>
                            <h5 className="font-serif text-sm text-white">{plan.title}</h5>
                          </div>
                          {plan.notes && (
                            <p className="mt-1 text-xs text-[#777777] font-light">
                              {plan.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-mono text-[#AAAAAA] uppercase shrink-0 ml-4">
                          {plan.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
