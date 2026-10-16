'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Bell, Heart, Camera, Music, MapPin, Cake, Mail, CheckSquare } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { formatDate } from '@/lib/date-utils';

export function NotificationDrawer() {
  const router = useRouter();
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'message_reaction':
      case 'post_reaction':
        return <Heart className="h-4 w-4 text-white" />;
      case 'memory_added':
        return <Camera className="h-4 w-4 text-white" />;
      case 'song_added':
        return <Music className="h-4 w-4 text-white" />;
      case 'place_added':
        return <MapPin className="h-4 w-4 text-white" />;
      case 'birthday_soon':
        return <Cake className="h-4 w-4 text-white" />;
      case 'letter_written':
        return <Mail className="h-4 w-4 text-white" />;
      case 'bucket_completed':
        return <CheckSquare className="h-4 w-4 text-white" />;
      default:
        return <Bell className="h-4 w-4 text-white" />;
    }
  };

  const handleItemClick = (notif: (typeof notifications)[0]) => {
    markNotificationRead(notif.id);
    setIsNotificationDrawerOpen(false);
    if (notif.linkUrl) {
      router.push(notif.linkUrl);
    }
  };

  return (
    <AnimatePresence>
      {isNotificationDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsNotificationDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Right Sliding Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="absolute inset-y-0 right-0 max-w-md w-full bg-[#0D0D0D] border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-white" />
                <h3 className="font-serif text-lg text-white">Our Activity & Alerts</h3>
              </div>
              <div className="flex items-center gap-2">
                {notifications.some(n => !n.isRead) && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-[#888888] hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/5"
                  >
                    <Check className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsNotificationDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#181818] border border-white/10 text-[#777777] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#666666]">
                  <Bell className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm font-serif text-[#AAAAAA]">All caught up</p>
                  <p className="text-xs font-light mt-1">No new partner alerts right now.</p>
                </div>
              ) : (
                notifications.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                      item.isRead
                        ? 'bg-[#121212] border-white/5 text-[#888888] hover:border-white/15'
                        : 'bg-[#181818] border-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#222222] border border-white/10 shadow-inner">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm font-medium text-[#E5E5E5] line-clamp-1">
                            {item.title}
                          </p>
                          {!item.isRead && (
                            <span className="h-2 w-2 rounded-full bg-white shrink-0" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#777777] font-light line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#555555]">
                          <span>{formatDate(item.timestamp, 'relative')}</span>
                          {item.actionText && (
                            <span className="text-[#AAAAAA] hover:underline">
                              {item.actionText} →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
