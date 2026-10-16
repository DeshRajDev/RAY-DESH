'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Skiper6Item {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  image?: string;
  description?: string;
  badge?: string;
  onClick?: () => void;
}

interface Skiper6Props {
  items: Skiper6Item[];
  className?: string;
  autoPlay?: boolean;
  onSelect?: (item: Skiper6Item) => void;
}

/**
 * Skiper6 Claymorphic Interactive Stacked Carousel
 * Features 3D layered elevation, tactile spring physics, and micro-interactions.
 */
export function Skiper6({ items, className, onSelect }: Skiper6Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex];

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className={cn('relative w-full select-none overflow-hidden py-4', className)}>
      {/* Header controls */}
      <div className="mb-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1A1A1A] text-[#E5E5E5] shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-[#FFFFFF]" />
          </div>
          <span className="text-xs font-medium tracking-widest text-[#777777] uppercase">Featured Moments</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrev}
            aria-label="Previous"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] text-[#AAAAAA] hover:text-[#FFFFFF] border border-white/10 shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="px-2 text-xs font-mono text-[#777777]">
            {currentIndex + 1} / {items.length}
          </div>
          <button
            onClick={handleNext}
            aria-label="Next"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] text-[#AAAAAA] hover:text-[#FFFFFF] border border-white/10 shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3D Stack Container */}
      <div className="relative h-[340px] sm:h-[380px] w-full flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => {
            const offset = (idx - currentIndex + items.length) % items.length;
            
            // Only render top 3 cards in stack for performance
            if (offset > 2 && offset < items.length - 1) return null;

            const isTop = offset === 0;
            const isSecond = offset === 1;
            const isThird = offset === 2;

            let zIndex = 30;
            let scale = 1;
            let translateY = 0;
            let opacity = 1;

            if (isSecond) {
              zIndex = 20;
              scale = 0.94;
              translateY = 16;
              opacity = 0.75;
            } else if (isThird) {
              zIndex = 10;
              scale = 0.88;
              translateY = 32;
              opacity = 0.45;
            } else if (!isTop) {
              zIndex = 5;
              scale = 0.82;
              translateY = 48;
              opacity = 0;
            }

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{
                  opacity,
                  scale,
                  y: translateY,
                  zIndex,
                }}
                exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.25 } }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                onClick={() => {
                  if (isTop) {
                    item.onClick?.();
                    onSelect?.(item);
                  } else {
                    setCurrentIndex(idx);
                  }
                }}
                className={cn(
                  'absolute inset-x-2 sm:inset-x-6 top-0 bottom-8 cursor-pointer rounded-3xl overflow-hidden border border-white/10',
                  'bg-gradient-to-b from-[#171717] to-[#0A0A0A]',
                  'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)]'
                )}
              >
                {/* Background image if present */}
                {item.image && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
                  </div>
                )}

                {/* Card Content */}
                <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    {item.category && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-[#E5E5E5] backdrop-blur-md border border-white/10">
                        {item.category}
                      </span>
                    )}
                    {item.badge && (
                      <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-[#AAAAAA] border border-white/5 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-white line-clamp-2">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-xs font-mono text-[#AAAAAA]">{item.subtitle}</p>
                    )}
                    {item.description && (
                      <p className="text-sm text-[#888888] line-clamp-2 leading-relaxed font-light">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Dot Indicators */}
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/20 hover:bg-white/40'
            )}
          />
        ))}
      </div>
    </div>
  );
}
