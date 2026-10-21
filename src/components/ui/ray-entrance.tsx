'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initialMemories } from '@/constants/initial-data';
import { memoryService } from '@/services/memory.service';

interface RayEntranceProps {
  onComplete: () => void;
}

export function RayEntrance({ onComplete }: RayEntranceProps) {
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [memoryPhotos, setMemoryPhotos] = useState<string[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setPrefersReducedMotion(true);
        const timer = setTimeout(() => {
          sessionStorage.setItem('ray_intro_shown', 'true');
          onComplete();
        }, 1200);
        return () => clearTimeout(timer);
      }
    }

    // Load available memory photos
    memoryService.getMemories().then(res => {
      if (res.data && res.data.length > 0) {
        const photos = res.data.flatMap(m => m.mediaUrls || [m.coverUrl]).filter(Boolean);
        if (photos.length > 0) {
          setMemoryPhotos(photos.slice(0, 8));
          return;
        }
      }
      // Fallback photos
      const fallback = initialMemories.flatMap(m => m.mediaUrls || [m.coverUrl]).filter(Boolean);
      setMemoryPhotos(fallback.slice(0, 8));
    }).catch(() => {
      const fallback = initialMemories.flatMap(m => m.mediaUrls || [m.coverUrl]).filter(Boolean);
      setMemoryPhotos(fallback.slice(0, 8));
    });

    // Progression timeline (Target: ~4.5 seconds total)
    const t1 = setTimeout(() => setStage(2), 1100);
    const t2 = setTimeout(() => setStage(3), 2200);
    const t3 = setTimeout(() => setStage(4), 3700);
    const t4 = setTimeout(() => {
      sessionStorage.setItem('ray_intro_shown', 'true');
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  // Reduced motion quick view
  if (prefersReducedMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] text-white select-none"
      >
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-b from-[#222222] to-[#111111] border border-white/20 shadow-2xl">
          <img
            src="/icons/ray-logo-cute-web.png"
            alt="Ray"
            className="h-16 w-16 object-contain"
          />
        </div>
      </motion.div>
    );
  }

  // 6 orbit positions around center for Stage 2 & 3
  const orbitCount = Math.min(memoryPhotos.length || 6, 6);
  const ringAngles = Array.from({ length: orbitCount }, (_, i) => (i * 360) / orbitCount);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] overflow-hidden select-none pointer-events-auto"
    >
      {/* Background Soft Ambient Light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,rgba(5,5,5,0.95)_70%)]" />

      {/* STAGE 2: Circular Rotating Memory Ring */}
      <AnimatePresence>
        {(stage === 2 || stage === 3) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{
              opacity: { duration: 0.8 },
              scale: { duration: 0.9, ease: 'easeOut' },
              rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
            }}
            className="absolute h-[290px] w-[290px] sm:h-[380px] sm:w-[380px] rounded-full pointer-events-none"
          >
            {ringAngles.map((angle, idx) => {
              const photo = memoryPhotos[idx % memoryPhotos.length];
              const rad = (angle * Math.PI) / 180;
              const radius = typeof window !== 'undefined' && window.innerWidth < 640 ? 120 : 160;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;

              return (
                <div
                  key={idx}
                  style={{
                    transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                    left: '50%',
                    top: '50%',
                  }}
                  className="absolute"
                >
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden border-2 border-white/20 bg-[#161616] shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)]"
                  >
                    <img
                      src={photo}
                      alt="Memory"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE 3: Floating Memory Tiles & Cute Animated Cats */}
      <AnimatePresence>
        {stage === 3 && (
          <>
            {/* Left gliding memory card */}
            <motion.div
              initial={{ x: -180, opacity: 0, y: -60, rotate: -6 }}
              animate={{ x: -100, opacity: 0.85, y: -40, rotate: -4 }}
              exit={{ x: -220, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="hidden sm:block absolute left-12 top-1/4 h-24 w-28 rounded-2xl overflow-hidden border border-white/20 bg-[#161616] shadow-2xl"
            >
              <img
                src={memoryPhotos[0] || initialMemories[0]?.coverUrl}
                alt="Floating Memory"
                className="h-full w-full object-cover"
              />
            </motion.div>

            {/* Right gliding memory card */}
            <motion.div
              initial={{ x: 180, opacity: 0, y: 60, rotate: 6 }}
              animate={{ x: 100, opacity: 0.85, y: 40, rotate: 4 }}
              exit={{ x: 220, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="hidden sm:block absolute right-12 bottom-1/4 h-24 w-28 rounded-2xl overflow-hidden border border-white/20 bg-[#161616] shadow-2xl"
            >
              <img
                src={memoryPhotos[1] || initialMemories[1]?.coverUrl}
                alt="Floating Memory"
                className="h-full w-full object-cover"
              />
            </motion.div>

            {/* Playful jumping cat 1 (Left to Center Arc) */}
            <motion.div
              initial={{ x: -160, y: 120, opacity: 0, scale: 0.7 }}
              animate={{
                x: [-140, -60, 20],
                y: [120, 20, 90],
                opacity: [0, 1, 0],
                scale: [0.7, 1, 0.9],
              }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute z-20 pointer-events-none"
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl">
                <span className="text-xl">🐱</span>
                <span className="text-[10px] font-mono tracking-wider uppercase text-white/90">Ray</span>
              </div>
            </motion.div>

            {/* Playful jumping cat 2 (Right to Center Arc) */}
            <motion.div
              initial={{ x: 160, y: -100, opacity: 0, scale: 0.7 }}
              animate={{
                x: [140, 60, -20],
                y: [-100, -20, -70],
                opacity: [0, 1, 0],
                scale: [0.7, 1, 0.9],
              }}
              transition={{ duration: 1.4, delay: 0.3, ease: 'easeInOut' }}
              className="absolute z-20 pointer-events-none"
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl">
                <span className="text-xl">🐾</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CENTRAL RAY LOGO (Stages 1 to 4) */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: stage === 4 ? 1.05 : 1,
          opacity: 1,
        }}
        transition={{
          duration: 0.9,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-30 flex flex-col items-center"
      >
        <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-gradient-to-b from-[#262626] to-[#111111] border border-white/25 shadow-[0_15px_40px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.3)]">
          <img
            src="/icons/ray-logo-cute-web.png"
            alt="Ray"
            className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-4 text-center"
        >
          <h1 className="font-serif text-2xl sm:text-3xl font-light tracking-wide text-white">
            Ray
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#888888] mt-1">
            Private Sanctuary
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
