'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, History, Heart, Sparkles, MapPin, Calendar, Music, Quote, Camera } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Milestone } from '@/types';
import { timelineService } from '@/services/timeline.service';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/date-utils';

export default function TimelinePage() {
  const { openMediaViewer, triggerHeartEffect } = useApp();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New milestone form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newLocation, setNewLocation] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [newQuote, setNewQuote] = useState('');

  useEffect(() => {
    timelineService.getMilestones().then(res => setMilestones(res.data ?? []));
    const unsubscribe = timelineService.subscribe(updated => setMilestones(updated));
    return () => unsubscribe();
  }, []);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await timelineService.addMilestone({
      title: newTitle.trim(),
      description: newDesc.trim(),
      date: new Date(newDate).toISOString(),
      location: newLocation.trim() || undefined,
      photos: newPhoto ? [newPhoto] : [],
      category: 'special_moments' as any,
      highlightQuote: newQuote.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewLocation('');
    setNewPhoto('');
    setNewQuote('');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <History className="h-3.5 w-3.5 text-white" />
            <span>Chronological Journey</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Story Timeline</h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            Tracing every chapter from our first hello to the life we build today
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Milestone
        </button>
      </div>

      {/* Vertical Timeline Tree */}
      <div className="relative pl-7 sm:pl-10 space-y-8 sm:space-y-12 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-white/40 before:via-white/20 before:to-transparent">
        {milestones.map((milestone, idx) => (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative"
          >
            {/* Timeline node icon */}
            <div className="absolute -left-7 sm:-left-10 top-1.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-white text-black ring-4 ring-[#070707] shadow-lg">
              <Heart className="h-3 w-3 fill-black" />
            </div>

            {/* Milestone Card */}
            <div className="clay-card rounded-3xl p-4 sm:p-8 border border-white/10 bg-[#0F0F0F] space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                <span className="text-xs font-mono text-white bg-white/10 px-3 py-1 rounded-full">
                  {formatDate(milestone.date, 'long')}
                </span>
                {milestone.location && (
                  <span className="flex items-center gap-1 text-xs font-mono text-[#777777]">
                    <MapPin className="h-3.5 w-3.5 text-white" />
                    {milestone.location}
                  </span>
                )}
              </div>

              <h3 className="font-serif text-2xl text-white font-normal">
                {milestone.title}
              </h3>

              <p className="text-sm text-[#CCCCCC] font-light leading-relaxed whitespace-pre-wrap">
                {milestone.description}
              </p>

              {/* Quote if attached */}
              {milestone.highlightQuote && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-3">
                  <Quote className="h-5 w-5 text-white/30 shrink-0 mt-0.5" />
                  <p className="font-serif text-sm text-white italic font-light">
                    &ldquo;{milestone.highlightQuote}&rdquo;
                  </p>
                </div>
              )}

              {/* Photos attached */}
              {milestone.photos && milestone.photos.length > 0 && (
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {milestone.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt="Milestone photo"
                      onClick={() => openMediaViewer(milestone.photos, i, { title: milestone.title })}
                      className="h-48 w-full rounded-2xl object-cover grayscale hover:grayscale-0 cursor-pointer border border-white/10 transition-all duration-300"
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ADD MILESTONE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add a Relationship Milestone"
        description="Preserve a key turning point in our love story."
      >
        <form onSubmit={handleAddMilestone} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Milestone Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. The Day We Adopted Little Mochi"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Location</label>
              <input
                type="text"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                placeholder="e.g. Manali Pass"
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Photo URL</label>
            <input
              type="text"
              value={newPhoto}
              onChange={e => setNewPhoto(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Milestone Narrative</label>
            <textarea
              required
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="How the memory unfolded..."
              rows={3}
              className="clay-input w-full p-3 text-xs leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Highlight Quote</label>
            <input
              type="text"
              value={newQuote}
              onChange={e => setNewQuote(e.target.value)}
              placeholder="e.g. Cold noses and warm hands."
              className="clay-input w-full h-10 px-3 text-xs font-serif"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="clay-btn clay-btn-secondary px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="clay-btn clay-btn-primary px-5 py-2 text-xs font-medium"
            >
              Save Milestone
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
