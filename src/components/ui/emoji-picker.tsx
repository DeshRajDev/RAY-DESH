'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Heart, Smile, Sparkles, Coffee, Compass, Activity, Flag, Clock } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: string[];
}

const CATEGORIES: EmojiCategory[] = [
  {
    id: 'hearts',
    name: 'Love & Hearts',
    icon: <Heart className="h-3.5 w-3.5" />,
    emojis: [
      '❤️', '💖', '💕', '💞', '💓', '💗', '💘', '💝', '💟', '💌', 
      '❣️', '❤️‍🔥', '❤️‍🩹', '🤍', '🖤', '🤎', '💜', '💙', '💚', '💛', 
      '🧡', '💍', '👑', '💐', '🌹', '🥀', '🌺', '🌸', '✨', '🥺', 
      '🥰', '😍', '😘', '😚', '🫂', '🕊️', '🧸', '🧿'
    ],
  },
  {
    id: 'smileys',
    name: 'Smileys & Faces',
    icon: <Smile className="h-3.5 w-3.5" />,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '🥹', '😅', '😂', '🤣', '🥲', 
      '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😋', '😛', '😝', 
      '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', 
      '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', 
      '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', 
      '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', 
      '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', 
      '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢'
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures & Hands',
    icon: <Sparkles className="h-3.5 w-3.5" />,
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', 
      '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', 
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲', 
      '🤝', '🙏', '✍️', '💅', '🤳', '💪'
    ],
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: <Activity className="h-3.5 w-3.5" />,
    emojis: [
      '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
      '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', 
      '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', 
      '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐾', '🌸', '🌹', '🌻', 
      '🍀', '🍁', '🍂', '🍃', '🌙', '⭐', '☀️', '🌈'
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: <Coffee className="h-3.5 w-3.5" />,
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', 
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥐', '🥯', 
      '🍞', '🧀', '🥞', '🧇', '🍕', '🍟', '🍔', '🌮', '🌯', '🥗', 
      '🍝', '🍜', '🍣', '🍱', '🍦', '🍰', '🎂', '🧁', '🍫', '🍿', 
      '🍩', '🍪', '☕', '🫖', '🍵', '🧃', '🥤', '🍷', '🥂', '🍻'
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Places',
    icon: <Compass className="h-3.5 w-3.5" />,
    emojis: [
      '✈️', '🚀', '🚗', '🚕', '🚙', '🏎️', '🛵', '🚲', '🛴', '⛵', 
      '🚢', '🗺️', '🧭', '🏖️', '🏝️', '⛰️', '🏔️', '🏕️', '⛺', '🏠', 
      '🏡', '🗼', '🗽', '🌃', '🌆', '🌅', '🌄', '🎡', '🎢', '⛲'
    ],
  },
  {
    id: 'symbols',
    name: 'Symbols & Magic',
    icon: <Flag className="h-3.5 w-3.5" />,
    emojis: [
      '🔥', '✨', '🌟', '💫', '⚡', '💥', '💯', '💢', '💤', '🎉', 
      '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🎵', '🎶', '🎼', 
      '🔮', '🧿', '💎', '💡', '🕯️', '📷', '📱', '💻', '⌚', '⏳'
    ],
  },
];

const RECENT_KEY = 'ray_recent_emojis_v1';

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState<string>('hearts');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        setRecentEmojis(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);

    // Update recents
    setRecentEmojis((prev) => {
      const updated = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 24);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Filter emojis based on search
  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    // Return all emojis from all categories that fit query
    const all = CATEGORIES.flatMap((c) => c.emojis);
    return Array.from(new Set(all));
  }, [searchQuery]);

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab) || CATEGORIES[0];

  return (
    <div className="flex flex-col w-[300px] sm:w-[340px] h-[340px] rounded-2xl border border-white/15 bg-[#121212]/95 backdrop-blur-xl shadow-2xl overflow-hidden select-none z-50">
      {/* Search Header */}
      <div className="p-2.5 border-b border-white/10 bg-[#0A0A0A]/60">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#777777]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emojis..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-white/25"
          />
        </div>
      </div>

      {/* Categories Bar */}
      {!searchQuery && (
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5 bg-[#0D0D0D]">
          {recentEmojis.length > 0 && (
            <button
              onClick={() => setActiveTab('recent')}
              className={`p-1.5 rounded-lg transition-colors ${
                activeTab === 'recent'
                  ? 'bg-white/15 text-white'
                  : 'text-[#666666] hover:text-white'
              }`}
              title="Recently Used"
            >
              <Clock className="h-3.5 w-3.5" />
            </button>
          )}

          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                activeTab === cat.id
                  ? 'bg-white/15 text-white'
                  : 'text-[#666666] hover:text-white'
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid Container */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-white/10">
        {searchQuery ? (
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] mb-2 block">
              Search Results
            </span>
            <div className="grid grid-cols-7 gap-1">
              {filteredEmojis?.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEmojiClick(emoji)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-xl transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : activeTab === 'recent' ? (
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] mb-2 block">
              Recently Used
            </span>
            <div className="grid grid-cols-7 gap-1">
              {recentEmojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEmojiClick(emoji)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-xl transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] mb-2 block">
              {activeCategory.name}
            </span>
            <div className="grid grid-cols-7 gap-1">
              {activeCategory.emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEmojiClick(emoji)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-xl transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
