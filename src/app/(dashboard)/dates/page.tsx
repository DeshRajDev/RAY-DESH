'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, CalendarHeart, Clock, MapPin, Sparkles, Trash2, Heart } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { DateEvent, DateEventType } from '@/types';
import { dateService } from '@/services/date.service';
import { Modal } from '@/components/ui/modal';
import { timeUntil, formatDate } from '@/lib/date-utils';

const DATE_TYPES: DateEventType[] = [
  'Anniversary',
  'Birthday',
  'First Meeting',
  'First Date',
  'First Message',
  'Special Moment',
  'Trip',
  'Custom',
];

export default function DatesPage() {
  const { user, triggerHeartEffect } = useApp();
  const [dates, setDates] = useState<DateEvent[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Date form state
  const [newTitle, setNewTitle] = useState('');
  const [newDateVal, setNewDateVal] = useState(new Date().toISOString().slice(0, 10));
  const [newType, setNewType] = useState<DateEventType>('Anniversary');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);

  useEffect(() => {
    dateService.getDates().then(res => setDates(res.data));
    const unsubscribe = dateService.subscribe(updated => setDates(updated));
    return () => unsubscribe();
  }, []);

  const handleAddDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await dateService.addDate({
      title: newTitle.trim(),
      date: new Date(newDateVal).toISOString(),
      type: newType,
      description: newDescription.trim() || undefined,
      location: newLocation.trim() || undefined,
      isRecurringYearly: isRecurring,
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewLocation('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this milestone date?')) {
      await dateService.deleteDate(id);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <CalendarHeart className="h-3.5 w-3.5 text-white" />
            <span>Relationship Milestones</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Important Dates</h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            Every anniversary, birthday, first moment, and upcoming getaway
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Special Date
        </button>
      </div>

      {/* Dates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dates.map(item => {
          const countdown = timeUntil(item.date, item.isRecurringYearly);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="clay-card relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/10 bg-[#0F0F0F] shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full bg-white/10 px-3 py-0.5 text-[10px] font-mono text-white">
                    {item.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => triggerHeartEffect()}
                      className="text-[#666666] hover:text-white transition-colors"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-[#666666] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-serif text-2xl text-white font-normal">{item.title}</h3>
                {item.description && (
                  <p className="mt-2 text-xs sm:text-sm text-[#888888] font-light leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Countdown Unit Tiles */}
              <div className="my-6 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-[#141414] border border-white/5 p-3">
                  <div className="text-2xl sm:text-3xl font-serif text-white font-light">
                    {countdown.days}
                  </div>
                  <div className="text-[10px] uppercase font-mono text-[#777777] mt-0.5">Days</div>
                </div>
                <div className="rounded-2xl bg-[#141414] border border-white/5 p-3">
                  <div className="text-2xl sm:text-3xl font-serif text-white font-light">
                    {countdown.hours}
                  </div>
                  <div className="text-[10px] uppercase font-mono text-[#777777] mt-0.5">Hours</div>
                </div>
                <div className="rounded-2xl bg-[#141414] border border-white/5 p-3">
                  <div className="text-2xl sm:text-3xl font-serif text-white font-light">
                    {countdown.minutes}
                  </div>
                  <div className="text-[10px] uppercase font-mono text-[#777777] mt-0.5">Minutes</div>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs font-mono text-[#666666]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-white" />
                  {formatDate(item.date, 'medium')}
                </span>
                {item.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.location}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ADD DATE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add an Important Date"
        description="We'll keep track of the countdown and celebrate every year."
      >
        <form onSubmit={handleAddDate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Milestone Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Our First Date Anniversary"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Date Event Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as DateEventType)}
                className="clay-input w-full h-10 px-3 text-xs bg-[#0D0D0D]"
              >
                {DATE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Date</label>
              <input
                type="date"
                value={newDateVal}
                onChange={e => setNewDateVal(e.target.value)}
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Location (optional)</label>
            <input
              type="text"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              placeholder="e.g. Skyline Rooftop Cafe"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Memory Description / Note</label>
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="What we plan to do or how this day started..."
              rows={2}
              className="clay-input w-full p-3 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={e => setIsRecurring(e.target.checked)}
              className="rounded bg-[#111111] border-white/20"
            />
            <label htmlFor="recurring" className="text-xs text-[#CCCCCC]">
              Repeat every year (annual countdown)
            </label>
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
