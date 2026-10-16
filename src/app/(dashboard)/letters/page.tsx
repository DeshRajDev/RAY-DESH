'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mail, Heart, Lock, Check, Sparkles, Feather, X, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '@/stores/app-context';
import { LoveLetter, LetterOccasion } from '@/types';
import { letterService } from '@/services/letter.service';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/date-utils';

const OCCASIONS: LetterOccasion[] = [
  "Open when you're missing me",
  "Open when you're sad",
  "Open when you need motivation",
  "Open on our anniversary",
  "Open on your birthday",
  "Open when you need a smile",
  "Open when you can't sleep",
  "Open on a rainy day",
  "Open just because",
];

export default function LettersPage() {
  const { user, partner, triggerHeartEffect } = useApp();
  const [letters, setLetters] = useState<LoveLetter[]>([]);
  const [activeReadingLetter, setActiveReadingLetter] = useState<LoveLetter | null>(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // New Letter form state
  const [newOccasion, setNewOccasion] = useState<LetterOccasion>("Open when you're missing me");
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSealColor, setNewSealColor] = useState<LoveLetter['waxSealColor']>('monochrome-silver');

  useEffect(() => {
    letterService.getLetters().then(res => setLetters(res.data));
    const unsubscribe = letterService.subscribe(updated => setLetters(updated));
    return () => unsubscribe();
  }, []);

  const handleUnseal = async (letter: LoveLetter) => {
    if (!letter.isOpened) {
      await letterService.unsealLetter(letter.id);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#aaaaaa', '#777777'],
      });
      triggerHeartEffect();
    }
    setActiveReadingLetter(letter);
  };

  const handleWriteLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    await letterService.createLetter({
      authorId: user.id,
      authorName: user.name,
      recipientId: partner.id,
      recipientName: partner.name,
      occasion: newOccasion,
      title: newTitle.trim(),
      content: newContent.trim(),
      waxSealColor: newSealColor,
    });

    setIsWriteModalOpen(false);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <Mail className="h-3.5 w-3.5 text-white" />
            <span>Digital Envelopes &amp; Notes</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Letters &amp; Notes</h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            Sealed messages waiting to be opened when the exact moment arrives
          </p>
        </div>

        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-medium flex items-center gap-2"
        >
          <Feather className="h-4 w-4" />
          Seal a Letter
        </button>
      </div>

      {/* Envelopes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {letters.map(letter => (
          <motion.div
            key={letter.id}
            whileHover={{ y: -4 }}
            onClick={() => handleUnseal(letter)}
            className={`group relative rounded-3xl p-6 border cursor-pointer flex flex-col justify-between h-72 transition-all select-none ${
              letter.isOpened
                ? 'bg-[#101010] border-white/10 shadow-md'
                : 'bg-gradient-to-b from-[#181818] to-[#0A0A0A] border-white/20 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2)]'
            }`}
          >
            {/* Wax Seal Stamp in Top Center */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#777777]">
                From {letter.authorName}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202020] border border-white/30 shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform">
                <Heart className={`h-4 w-4 ${letter.isOpened ? 'text-[#888888]' : 'fill-white text-white'}`} />
              </div>
            </div>

            {/* Occasion & Title */}
            <div className="space-y-2 text-center my-auto">
              <span className="text-xs font-mono uppercase tracking-wider text-[#AAAAAA] block">
                {letter.occasion}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-normal group-hover:underline line-clamp-2">
                {letter.title}
              </h3>
            </div>

            {/* Bottom Status */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] font-mono text-[#666666]">
              <span>{formatDate(letter.createdAt, 'short')}</span>
              <span className={`px-2 py-0.5 rounded-full ${letter.isOpened ? 'bg-white/5 text-[#888888]' : 'bg-white text-black font-semibold'}`}>
                {letter.isOpened ? 'Unsealed' : 'Break Wax Seal 💌'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* READING LETTER MODAL */}
      <AnimatePresence>
        {activeReadingLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveReadingLetter(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl rounded-3xl border border-white/20 bg-[#111111] p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.2)] z-10 my-auto text-[#E5E5E5] space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#AAAAAA]">
                    {activeReadingLetter.occasion}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mt-1">
                    {activeReadingLetter.title}
                  </h2>
                </div>

                <button
                  onClick={() => setActiveReadingLetter(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#181818] text-[#777777] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Letter Text Content */}
              <div className="max-h-96 overflow-y-auto pr-2">
                <p className="font-serif text-base sm:text-lg text-[#DDDDDD] font-light leading-relaxed whitespace-pre-wrap">
                  {activeReadingLetter.content}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono text-[#777777]">
                <span>Written with all my heart • {activeReadingLetter.authorName}</span>
                <button
                  onClick={() => {
                    triggerHeartEffect();
                  }}
                  className="flex items-center gap-1.5 text-white hover:underline"
                >
                  <Heart className="h-3.5 w-3.5 fill-white" /> Send Love
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WRITE LOVE LETTER MODAL */}
      <Modal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        title="Seal a Love Letter"
        description="Leave a message to be unsealed when your partner needs it most."
      >
        <form onSubmit={handleWriteLetter} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Occasion / Prompt</label>
            <select
              value={newOccasion}
              onChange={e => setNewOccasion(e.target.value as LetterOccasion)}
              className="clay-input w-full h-10 px-3 text-xs bg-[#0D0D0D]"
            >
              {OCCASIONS.map(occ => (
                <option key={occ} value={occ}>{occ}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Letter Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Close your eyes and breathe"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Letter Content</label>
            <textarea
              required
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="My dearest Rey..."
              rows={6}
              className="clay-input w-full p-3 text-xs font-serif leading-relaxed"
            />
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
              Seal with Wax
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
