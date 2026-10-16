'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckSquare, Sparkles, Check, Heart, MapPin, Calendar, Star, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '@/stores/app-context';
import { BucketListItem, BucketListCategory, BucketListPriority } from '@/types';
import { bucketListService } from '@/services/bucketList.service';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/date-utils';

const CATEGORIES: BucketListCategory[] = [
  'Travel',
  'Food',
  'Experiences',
  'Adventure',
  'Romantic',
  'Personal Goals',
  'Future',
  'Crazy Ideas',
];

export default function BucketListPage() {
  const { user, triggerHeartEffect } = useApp();
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New item form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<BucketListCategory>('Travel');
  const [newPriority, setNewPriority] = useState<BucketListPriority>('high');
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    bucketListService.getItems().then(res => setItems(res.data));
    const unsubscribe = bucketListService.subscribe(updated => setItems(updated));
    return () => unsubscribe();
  }, []);

  const handleToggleComplete = async (id: string, wasCompleted: boolean) => {
    await bucketListService.toggleComplete(id);
    if (!wasCompleted) {
      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#aaaaaa', '#666666', '#ffffff'],
      });
      triggerHeartEffect();
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await bucketListService.addItem({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      category: newCat,
      priority: newPriority,
      location: newLocation.trim() || undefined,
      addedById: user.id,
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewLocation('');
  };

  const completedCount = items.filter(i => i.isCompleted).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter(i => i.category === selectedCategory);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <CheckSquare className="h-3.5 w-3.5 text-white" />
            <span>Shared Dreams &amp; Aspirations</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Bucket List</h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            Adventures to embark upon, places to discover, and memories to make together
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Dream
        </button>
      </div>

      {/* Progress Card */}
      <div className="rounded-3xl border border-white/10 bg-[#0F0F0F] p-6 sm:p-8 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#AAAAAA]">
              Dream Progress
            </span>
          </div>
          <span className="text-sm font-mono text-white">
            {completedCount} of {items.length} Fulfilled ({progressPercent}%)
          </span>
        </div>

        <div className="w-full bg-[#181818] h-2.5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.5)]"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`clay-pill ${selectedCategory === 'All' ? 'active' : 'text-[#888888] hover:text-white'}`}
        >
          All Dreams ({items.length})
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`clay-pill ${selectedCategory === cat ? 'active' : 'text-[#888888] hover:text-white'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bucket List Items */}
      <div className="space-y-3">
        {filteredItems.map(item => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`clay-card group p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              item.isCompleted
                ? 'bg-[#0E0E0E] border-white/5 opacity-75'
                : 'bg-[#121212] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              {/* Checkbox trigger */}
              <button
                onClick={() => handleToggleComplete(item.id, item.isCompleted)}
                aria-label="Toggle completed"
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                  item.isCompleted
                    ? 'bg-white text-black border-white shadow-md'
                    : 'bg-[#181818] border-white/20 text-transparent hover:border-white/40'
                }`}
              >
                <Check className={`h-4 w-4 ${item.isCompleted ? 'stroke-[3]' : 'opacity-0'}`} />
              </button>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`font-serif text-base font-normal ${
                    item.isCompleted ? 'text-[#777777] line-through' : 'text-white'
                  }`}>
                    {item.title}
                  </h3>
                  <span className="text-[10px] font-mono uppercase bg-white/5 px-2 py-0.5 rounded text-[#AAAAAA]">
                    {item.category}
                  </span>
                  {item.priority === 'dream' && (
                    <span className="text-[10px] font-mono text-white bg-white/10 px-2 py-0.5 rounded">
                      ★ Ultimate Dream
                    </span>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-[#777777] font-light leading-relaxed">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-[#555555] pt-1">
                  {item.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </span>
                  )}
                  {item.isCompleted && item.completedDate ? (
                    <span className="text-white">
                      Fulfilled on {formatDate(item.completedDate, 'medium')} ❤️
                    </span>
                  ) : (
                    <span>Added {formatDate(item.dateAdded, 'short')}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ADD BUCKET LIST ITEM MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add to Our Bucket List"
        description="What shall we experience, explore, or build together?"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Dream / Goal Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Learn to make authentic pasta in Tuscany"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Category</label>
              <select
                value={newCat}
                onChange={e => setNewCat(e.target.value as BucketListCategory)}
                className="clay-input w-full h-10 px-3 text-xs bg-[#0D0D0D]"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Priority</label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as BucketListPriority)}
                className="clay-input w-full h-10 px-3 text-xs bg-[#0D0D0D]"
              >
                <option value="dream">Ultimate Dream</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Location (optional)</label>
            <input
              type="text"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              placeholder="e.g. Tuscany, Italy"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Details &amp; Vision</label>
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Describe the moment and feelings..."
              rows={3}
              className="clay-input w-full p-3 text-xs"
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
              Add to Dreams
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
