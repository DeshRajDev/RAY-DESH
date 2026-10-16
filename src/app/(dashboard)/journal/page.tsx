'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookHeart, Heart, Sparkles, Music, MapPin, Calendar, Smile } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { JournalEntry, JournalMood } from '@/types';
import { journalService } from '@/services/journal.service';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/date-utils';

const MOODS: { key: JournalMood; label: string; emoji: string }[] = [
  { key: 'loved', label: 'Deeply Loved', emoji: '❤️' },
  { key: 'peaceful', label: 'Peaceful & Calm', emoji: '🕊️' },
  { key: 'joyful', label: 'Radiant Joy', emoji: '✨' },
  { key: 'thoughtful', label: 'Reflective', emoji: '🌙' },
  { key: 'nostalgic', label: 'Nostalgic', emoji: '📼' },
  { key: 'grateful', label: 'Grateful', emoji: '🙏' },
  { key: 'silly', label: 'Playful & Goofy', emoji: '🤪' },
];

export default function JournalPage() {
  const { user, partner, triggerHeartEffect } = useApp();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // New entry form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState<JournalMood>('loved');
  const [newLocation, setNewLocation] = useState('');
  const [newMusic, setNewMusic] = useState('');

  useEffect(() => {
    journalService.getEntries().then(res => setEntries(res.data ?? []));
    const unsubscribe = journalService.subscribe(updated => setEntries(updated));
    return () => unsubscribe();
  }, []);

  const handleWriteEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    await journalService.addEntry({
      authorId: user.id,
      title: newTitle.trim(),
      content: newContent.trim(),
      date: new Date().toISOString(),
      mood: newMood,
      location: newLocation.trim() || undefined,
      musicTrack: newMusic.trim() || undefined,
      isFavorite: false,
    });

    setIsWriteModalOpen(false);
    setNewTitle('');
    setNewContent('');
    setNewLocation('');
    setNewMusic('');
  };

  const handleReact = async (entryId: string, emoji: string) => {
    await journalService.reactToEntry(entryId, emoji, user.id);
    triggerHeartEffect();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <BookHeart className="h-3.5 w-3.5 text-white" />
            <span>Private Couple Diary</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Journal</h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            Unfiltered thoughts, quiet reflections, and daily moments written for each other
          </p>
        </div>

        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Write Entry
        </button>
      </div>

      {/* Journal Entries Stream */}
      <div className="space-y-6">
        {entries.map(entry => {
          const author = entry.authorId === user.id ? user : partner;
          const moodObj = MOODS.find(m => m.key === entry.mood);

          return (
            <motion.article
              key={entry.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="clay-card rounded-3xl p-6 sm:p-10 border border-white/10 bg-[#0F0F0F] space-y-6 shadow-xl"
            >
              {/* Top metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="h-10 w-10 rounded-full object-cover border border-white/20 shadow-md"
                  />
                  <div>
                    <h4 className="font-serif text-sm text-white font-normal">{author.name}</h4>
                    <p className="text-[11px] font-mono text-[#777777]">
                      {formatDate(entry.date, 'long')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {moodObj && (
                    <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-mono text-[#CCCCCC] border border-white/5">
                      <span>{moodObj.emoji}</span>
                      <span>{moodObj.label}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-3">
                <h2 className="font-serif text-2xl sm:text-3xl text-white font-light tracking-tight">
                  {entry.title}
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-sm sm:text-base text-[#CCCCCC] font-light leading-relaxed whitespace-pre-wrap font-sans">
                    {entry.content}
                  </p>
                </div>
              </div>

              {/* Optional Music Track or Location attached */}
              {(entry.musicTrack || entry.location) && (
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#777777] bg-white/5 p-3 rounded-2xl">
                  {entry.musicTrack && (
                    <span className="flex items-center gap-1.5 text-[#AAAAAA]">
                      <Music className="h-3.5 w-3.5" />
                      Listening to: {entry.musicTrack}
                    </span>
                  )}
                  {entry.location && (
                    <span className="flex items-center gap-1.5 text-[#AAAAAA]">
                      <MapPin className="h-3.5 w-3.5" />
                      {entry.location}
                    </span>
                  )}
                </div>
              )}

              {/* Reaction bar */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReact(entry.id, '❤️')}
                    className="clay-btn clay-btn-secondary px-3 py-1 text-xs flex items-center gap-1.5 hover:scale-105 transition-transform"
                  >
                    <Heart className="h-3.5 w-3.5 fill-white text-white" />
                    <span>Loved</span>
                  </button>
                  <button
                    onClick={() => handleReact(entry.id, '🥹')}
                    className="clay-btn clay-btn-secondary px-3 py-1 text-xs hover:scale-105 transition-transform"
                  >
                    🥹 Touched
                  </button>
                </div>

                {entry.reactions && entry.reactions.length > 0 && (
                  <div className="flex items-center gap-1 text-xs font-mono text-[#777777]">
                    {entry.reactions.map((r, idx) => (
                      <span key={idx}>{r.emoji}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>

      {/* WRITE JOURNAL ENTRY MODAL */}
      <Modal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        title="Write in Our Journal"
        description="Share what you felt, what we experienced, or something you want to preserve."
      >
        <form onSubmit={handleWriteEntry} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Title of Entry</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Watching you laugh in the passenger seat"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Today&apos;s Dominant Emotion / Mood</label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setNewMood(m.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 border transition-all ${
                    newMood === m.key
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-[#141414] text-[#888888] border-white/5 hover:text-white'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Your Reflections &amp; Story</label>
            <textarea
              required
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Write freely from the heart..."
              rows={5}
              className="clay-input w-full p-3 text-xs leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Song Track (optional)</label>
              <input
                type="text"
                value={newMusic}
                onChange={e => setNewMusic(e.target.value)}
                placeholder="e.g. Holocene - Bon Iver"
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Location (optional)</label>
              <input
                type="text"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                placeholder="e.g. Living Room Balcony"
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsWriteModalOpen(false)}
              className="clay-btn clay-btn-secondary px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="clay-btn clay-btn-primary px-5 py-2 text-xs font-medium"
            >
              Save Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
