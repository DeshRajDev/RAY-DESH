'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Couple, Song, NotificationItem } from '@/types';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { musicService } from '@/services/music.service';
import { notificationService } from '@/services/notification.service';
import { isBirthdayToday } from '@/lib/date-utils';

interface AppContextType {
  isAuthenticated: boolean;
  user: User;
  partner: User;
  couple: Couple;
  switchUser: (userId: 'user_1' | 'user_2') => Promise<void>;
  logout: () => void;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  // Media Viewer
  activeMedia: {
    isOpen: boolean;
    urls: string[];
    currentIndex: number;
    title?: string;
    description?: string;
    date?: string;
    location?: string;
  } | null;
  openMediaViewer: (urls: string[], initialIndex?: number, meta?: { title?: string; description?: string; date?: string; location?: string }) => void;
  closeMediaViewer: () => void;
  // Command Palette
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  // Notification Drawer
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Birthday Celebration Overlay
  isBirthdayActive: boolean;
  isBirthdayPreview: boolean;
  triggerBirthdayCelebration: (preview?: boolean) => void;
  dismissBirthdayCelebration: () => void;
  // Audio player
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song) => void;
  togglePlay: () => void;
  playNextSong: () => void;
  playPrevSong: () => void;
  closePlayer: () => void;
  // Microinteraction sound & heart effects
  triggerHeartEffect: (x?: number, y?: number) => void;
  floatingHearts: { id: string; x: number; y: number }[];
  playTactileClick: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const [couple, setCouple] = useState<Couple | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(authService.getCurrentUser());
  const [partnerUser, setPartnerUser] = useState<User>(authService.getPartnerUser());
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [activeMedia, setActiveMedia] = useState<AppContextType['activeMedia']>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isBirthdayActive, setIsBirthdayActive] = useState(false);
  const [isBirthdayPreview, setIsBirthdayPreview] = useState(false);
  
  // Music state
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Microinteraction floating hearts
  const [floatingHearts, setFloatingHearts] = useState<{ id: string; x: number; y: number }[]>([]);

  useEffect(() => {
    // Fetch initial couple profile
    userService.getCoupleProfile().then(res => {
      setCouple(res.data);
      setIsAuthenticated(authService.isAuthenticated());
      setCurrentUser(authService.getCurrentUser());
      setPartnerUser(authService.getPartnerUser());
    });

    const unsubscribeCouple = userService.subscribe(updatedCouple => {
      setCouple(updatedCouple);
      setIsAuthenticated(authService.isAuthenticated());
      setCurrentUser(authService.getCurrentUser());
      setPartnerUser(authService.getPartnerUser());
    });

    const unsubscribeAuth = authService.subscribe(() => {
      setIsAuthenticated(authService.isAuthenticated());
      setCurrentUser(authService.getCurrentUser());
      setPartnerUser(authService.getPartnerUser());
    });

    // Notifications
    notificationService.getNotifications().then(res => {
      setNotifications(res.data);
    });
    const unsubscribeNotifs = notificationService.subscribe(notifs => {
      setNotifications(notifs);
    });

    // Music
    const unsubscribeMusic = musicService.subscribePlayer(playerState => {
      setCurrentSong(playerState.currentSong);
      setIsPlaying(playerState.isPlaying);
    });

    // Keyboard shortcut for Cmd+K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribeCouple();
      unsubscribeAuth();
      unsubscribeNotifs();
      unsubscribeMusic();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Check if birthday is today on mount
  useEffect(() => {
    if (partnerUser?.birthday && isBirthdayToday(partnerUser.birthday)) {
      setIsBirthdayActive(true);
    }
  }, [partnerUser]);

  // Sync theme class to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const switchUser = useCallback(async (userId: 'user_1' | 'user_2') => {
    await authService.switchUser(userId);
    setCurrentUser(authService.getCurrentUser());
    setPartnerUser(authService.getPartnerUser());
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  const updateUserProfile = useCallback(async (userId: string, updates: Partial<User>) => {
    await authService.updateUserProfile(userId, updates);
    setCurrentUser(authService.getCurrentUser());
    setPartnerUser(authService.getPartnerUser());
  }, []);

  const setTheme = useCallback((newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const openMediaViewer = useCallback((
    urls: string[], 
    initialIndex: number = 0, 
    meta?: { title?: string; description?: string; date?: string; location?: string }
  ) => {
    setActiveMedia({
      isOpen: true,
      urls,
      currentIndex: initialIndex,
      ...meta,
    });
  }, []);

  const closeMediaViewer = useCallback(() => {
    setActiveMedia(null);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    notificationService.markAsRead(id);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  const triggerBirthdayCelebration = useCallback((preview: boolean = true) => {
    setIsBirthdayPreview(preview);
    setIsBirthdayActive(true);
  }, []);

  const dismissBirthdayCelebration = useCallback(() => {
    setIsBirthdayActive(false);
    setIsBirthdayPreview(false);
  }, []);

  const playSong = useCallback((song: Song) => {
    musicService.playSong(song);
  }, []);

  const togglePlay = useCallback(() => {
    musicService.togglePlay();
  }, []);

  const playNextSong = useCallback(() => {
    musicService.playNext();
  }, []);

  const playPrevSong = useCallback(() => {
    musicService.playPrevious();
  }, []);

  const closePlayer = useCallback(() => {
    musicService.closePlayer();
  }, []);

  const triggerHeartEffect = useCallback((x?: number, y?: number) => {
    const heartX = x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
    const heartY = y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 200);
    const id = `heart_${Date.now()}_${Math.random()}`;
    setFloatingHearts(prev => [...prev, { id, x: heartX, y: heartY }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 1200);
  }, []);

  const playTactileClick = useCallback(() => {
    // Tactile sound
  }, []);

  if (!couple) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#050505] text-[#E5E5E5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#444444] border-t-[#FFFFFF]" />
          <p className="font-serif text-sm tracking-widest text-[#777777]">ENTERING OUR SANCTUARY...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        user: currentUser,
        partner: partnerUser,
        couple,
        switchUser,
        logout,
        updateUserProfile,
        theme,
        setTheme,
        toggleTheme,
        activeMedia,
        openMediaViewer,
        closeMediaViewer,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
        isBirthdayActive,
        isBirthdayPreview,
        triggerBirthdayCelebration,
        dismissBirthdayCelebration,
        currentSong,
        isPlaying,
        playSong,
        togglePlay,
        playNextSong,
        playPrevSong,
        closePlayer,
        triggerHeartEffect,
        floatingHearts,
        playTactileClick,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
