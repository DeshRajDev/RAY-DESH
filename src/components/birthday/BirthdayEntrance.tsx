'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BirthdayEntranceProps {
  onEnter: () => void;
  celebrantName?: string;
  celebrantPhoto?: string;
}

export function BirthdayEntrance({ onEnter, celebrantName = 'Ray', celebrantPhoto }: BirthdayEntranceProps) {
  // Sequence stages:
  // 1: Dark screen with subtle glowing particles
  // 2: Ray heart logo appears in center with pulsing glow
  // 3: White flower petals and delicate hearts drift in
  // 4: "Happy Birthday, My Love ❤️" reveals
  // 5: Personal message reveals: "Today is all about you, bchu..."
  // 6: "Enter Your Surprise" button appears with glow
  const [stage, setStage] = useState<number>(1);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(2), 1200);
    const t2 = setTimeout(() => setStage(3), 2600);
    const t3 = setTimeout(() => setStage(4), 4000);
    const t4 = setTimeout(() => setStage(5), 5800);
    const t5 = setTimeout(() => {
      setStage(6);
      // Gentle silver and monochrome confetti burst on complete reveal
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#ffffff', '#e5e5e5', '#cccccc', '#999999', '#ffffff'],
        disableForReducedMotion: true,
      });
    }, 7600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  const handleSkipOrEnter = () => {
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#d4d4d4', '#a3a3a3'],
    });
    onEnter();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#030303] text-white overflow-hidden select-none px-6 text-center"
    >
      {/* 1. Deep Ambient Radial Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,rgba(3,3,3,0.98)_75%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />

      {/* Floating Starlight Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            initial={{
              opacity: 0,
              y: Math.random() * 800,
              x: (i * 42) % (typeof window !== 'undefined' ? window.innerWidth : 800),
              scale: 0.4 + Math.random() * 0.6,
            }}
            animate={{
              opacity: [0.1, 0.7, 0.1],
              y: [null, -60, -120],
            }}
            transition={{
              duration: 4 + (i % 5),
              repeat: Infinity,
              delay: (i * 0.25) % 4,
              ease: 'easeInOut',
            }}
            className="absolute h-1 w-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          />
        ))}
      </div>

      {/* STAGE 3+: Delicate White Blossoms and Floating Hearts */}
      {stage >= 3 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(14)].map((_, i) => {
            const isFlower = i % 2 === 0;
            const startX = 10 + ((i * 7) % 85);
            return (
              <motion.div
                key={`petal-${i}`}
                initial={{
                  opacity: 0,
                  y: -40,
                  x: `${startX}vw`,
                  rotate: 0,
                  scale: 0.6,
                }}
                animate={{
                  opacity: [0, 0.85, 0],
                  y: ['0vh', '100vh'],
                  x: [`${startX}vw`, `${startX + (i % 2 === 0 ? 6 : -6)}vw`],
                  rotate: [0, 180, 360],
                  scale: [0.6, 1, 0.7],
                }}
                transition={{
                  duration: 8 + (i % 4),
                  repeat: Infinity,
                  delay: (i * 0.6),
                  ease: 'easeInOut',
                }}
                className="absolute text-white/80 drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]"
              >
                {isFlower ? (
                  // Elegant white blossom symbol
                  <span className="text-xl sm:text-2xl opacity-75">🌸</span>
                ) : (
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-white/80 text-white/90" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto space-y-6">
        {/* STAGE 2+: Centered Portrait of Ray in Glowing Circular Frame */}
        <AnimatePresence>
          {stage >= 2 && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Outer halo */}
              <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-white/20 via-rose-500/10 to-white/10 blur-xl animate-pulse" />

              <div className="relative flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-gradient-to-b from-[#333333] via-[#1a1a1a] to-[#0A0A0A] p-1.5 border border-white/30 shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.6)]">
                {celebrantPhoto ? (
                  <img
                    src={celebrantPhoto}
                    alt={celebrantName}
                    className="h-full w-full rounded-full object-cover shadow-inner"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-[#161616] flex items-center justify-center">
                    <Heart className="h-12 w-12 text-white fill-white drop-shadow-[0_0_16px_rgba(255,255,255,0.7)] animate-pulse" />
                  </div>
                )}
                {/* Floating mini heart badge */}
                <div className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-black/90 border border-white/30 flex items-center justify-center shadow-lg">
                  <Heart className="h-4 w-4 fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STAGE 4+: Birthday Headline */}
        <AnimatePresence>
          {stage >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="space-y-2 mt-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono uppercase tracking-[0.2em] text-[#AAAAAA]">
                <Sparkles className="h-3 w-3 text-white" />
                <span>November 1 • Asia/Kolkata</span>
                <Sparkles className="h-3 w-3 text-white" />
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-light text-white tracking-wide leading-tight drop-shadow-[0_4px_24px_rgba(255,255,255,0.3)]">
                Happy Birthday, My Love ❤️
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STAGE 5+: Personal Heartfelt Message */}
        <AnimatePresence>
          {stage >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="max-w-md px-4"
            >
              <p className="font-serif italic text-base sm:text-lg text-[#E0E0E0] leading-relaxed font-light">
                &ldquo;Today is all about you, bchu. Every little dream, every smile, and every beautiful moment ahead — I want to experience it all with you.&rdquo;
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STAGE 6+: Enter Your Surprise Action Button */}
        <AnimatePresence>
          {stage >= 6 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="pt-4"
            >
              <button
                onClick={handleSkipOrEnter}
                className="group relative flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-white text-black font-medium text-sm sm:text-base shadow-[0_10px_30px_rgba(255,255,255,0.25)] hover:bg-[#F0F0F0] hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <span>Enter Your Surprise</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle skip control in corner in case she wants to jump straight in */}
      {stage >= 2 && (
        <button
          onClick={handleSkipOrEnter}
          className="absolute bottom-6 right-6 text-[11px] font-mono tracking-wider text-[#666666] hover:text-white transition-colors"
        >
          Skip intro →
        </button>
      )}
    </motion.div>
  );
}
