'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';
import { notificationService } from '@/services/notification.service';

const PROMPT_DISMISSED_KEY = 'ray_notification_prompt_dismissed_v1';

export function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if push / notifications are supported
    if (!('Notification' in window)) return;

    // Don't show if already granted or explicitly denied
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;

    // Don't show if user previously clicked "Not Now"
    const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
    if (dismissed === 'true') return;

    // Delay prompt appearance by 3.5s so it doesn't interrupt initial page arrival
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const permission = await notificationService.requestPermission();
      if (permission === 'granted') {
        setShowPrompt(false);
      } else {
        localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
        setShowPrompt(false);
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 rounded-3xl border border-white/20 bg-[#0F0F0F]/95 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)] space-y-4 select-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#252525] to-[#121212] border border-white/20 shadow-inner">
                <Bell className="h-5 w-5 text-white" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-black">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                </span>
              </div>
              <div>
                <h4 className="font-serif text-sm font-medium text-white flex items-center gap-1.5">
                  Stay Connected with Ray
                </h4>
                <p className="text-[11px] text-[#888888] font-light mt-0.5">
                  Get real-time alerts for whispers, story replies &amp; reactions even when Ray is closed.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-[#666666] hover:text-white p-1 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleEnable}
              disabled={isEnabling}
              className="clay-btn clay-btn-primary flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-black" />
              <span>{isEnabling ? 'Enabling...' : 'Enable Notifications'}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="clay-btn clay-btn-secondary px-3.5 py-2.5 text-xs text-[#888888] hover:text-white active:scale-95 transition-all"
            >
              Not Now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
