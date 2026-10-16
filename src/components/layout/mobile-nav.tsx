'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  MessageCircle, 
  Camera, 
  Sparkles, 
  Grid, 
  X, 
  Flame, 
  Bookmark, 
  Music, 
  CalendarHeart, 
  Cake, 
  CheckSquare, 
  Compass, 
  MapPin, 
  BookHeart, 
  Mail, 
  History, 
  User, 
  Settings,
  Film 
} from 'lucide-react';
import { MAIN_NAV_ITEMS } from '@/constants/nav';

const iconMap: Record<string, any> = {
  Home,
  MessageCircle,
  Flame,
  Sparkles,
  Camera,
  Film,
  Bookmark,
  Music,
  CalendarHeart,
  Cake,
  CheckSquare,
  Compass,
  MapPin,
  BookHeart,
  Mail,
  History,
  User,
  Settings,
};

export function MobileNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  interface PrimaryTab {
    title: string;
    href: string;
    icon: any;
    badge?: string | number;
    onClick?: () => void;
  }

  const primaryTabs: PrimaryTab[] = [
    { title: 'Home', href: '/dashboard', icon: Home },
    { title: 'Chat', href: '/chat', icon: MessageCircle },
    { title: 'Memories', href: '/memories', icon: Camera },
    { title: 'Stories', href: '/stories', icon: Sparkles },
    { title: 'More', href: '#more', icon: Grid, onClick: () => setIsMoreOpen(true) },
  ];

  return (
    <>
      {/* Fixed Bottom Nav Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2">
        <div className="flex items-center justify-around">
          {primaryTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isMoreTab = tab.href === '#more';
            const isActive = !isMoreTab && (pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href)));

            if (isMoreTab) {
              return (
                <button
                  key={idx}
                  onClick={tab.onClick}
                  aria-label="Open More modules"
                  className="flex flex-col items-center gap-1 py-1 px-3 text-[#777777] hover:text-white transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-normal tracking-wide">More</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center gap-1 py-1 px-3 transition-all ${
                  isActive ? 'text-white font-medium scale-105' : 'text-[#777777] hover:text-[#AAAAAA]'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-white ring-2 ring-black" />
                  )}
                </div>
                <span className="text-[10px] font-normal tracking-wide">{tab.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* "More" Sheet Overlay for Mobile */}
      <AnimatePresence>
        {isMoreOpen && (
          <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl bg-[#0D0D0D] border-t border-white/10 p-6 overflow-y-auto z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="font-serif text-lg text-white">All Our Modules</h3>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A1A] text-[#777777] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 pb-12">
                {MAIN_NAV_ITEMS.map(item => {
                  const Icon = iconMap[item.iconName] || Home;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                        isActive
                          ? 'bg-white text-black border-white shadow-lg'
                          : 'bg-[#141414] border-white/5 text-[#AAAAAA] hover:text-white hover:border-white/15'
                      }`}
                    >
                      <Icon className={`h-6 w-6 mb-2 ${isActive ? 'text-black' : 'text-white'}`} />
                      <span className="text-xs font-medium">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
