'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { calculateRelationshipDuration, TimeDuration } from '@/lib/date-utils';
import { useApp } from '@/stores/app-context';

interface RelationshipTimerProps {
  startDate: string;
  showMilliseconds?: boolean;
}

export function RelationshipTimer({ startDate }: RelationshipTimerProps) {
  const { triggerHeartEffect } = useApp();
  const [duration, setDuration] = useState<TimeDuration>(() => calculateRelationshipDuration(startDate));

  useEffect(() => {
    // 1-second interval update prevents unnecessary renders while maintaining live accuracy
    const timer = setInterval(() => {
      setDuration(calculateRelationshipDuration(startDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [startDate]);

  const units = [
    { label: 'Years', value: duration.years },
    { label: 'Months', value: duration.months },
    { label: 'Days', value: duration.days },
    { label: 'Hours', value: String(duration.hours).padStart(2, '0') },
    { label: 'Minutes', value: String(duration.minutes).padStart(2, '0') },
    { label: 'Seconds', value: String(duration.seconds).padStart(2, '0') },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              triggerHeartEffect(rect.left + rect.width / 2, rect.top);
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] border border-white/10 text-[#FFFFFF] shadow-inner hover:scale-110 active:scale-90 transition-transform"
            title="Click to send love"
          >
            <Heart className="h-3.5 w-3.5 fill-white" />
          </button>
          <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-[#777777] truncate">
            Together in this universe
          </span>
        </div>
        <div className="text-[11px] sm:text-xs font-mono text-[#555555] shrink-0">
          Day #{duration.totalDays.toLocaleString()}
        </div>
      </div>

      {/* Claymorphic Time Blocks Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {units.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-[#181818] to-[#0D0D0D] p-2.5 sm:p-4 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] group hover:border-white/20 transition-all"
          >
            <div className="text-xl sm:text-3xl font-serif font-light text-white tracking-tight tabular-nums">
              {unit.value}
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider sm:tracking-widest text-[#777777] mt-0.5 sm:mt-1 group-hover:text-[#AAAAAA] transition-colors">
              {unit.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
