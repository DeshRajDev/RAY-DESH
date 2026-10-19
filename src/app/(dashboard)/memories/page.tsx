'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, Heart, MapPin, Calendar, Tag, Filter, Search, Grid, Eye } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Memory, MemoryCategory } from '@/types';
import { memoryService } from '@/services/memory.service';
import { Modal, EmptyState } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/date-utils';

const CATEGORIES: MemoryCategory[] = [
  'All',
  'Photos',
  'Videos',
  'Screenshots',
  'Trips',
  'Dates',
  'Birthdays',
  'Special Moments',
];

export default function MemoriesPage() {
  const { user, openMediaViewer, triggerHeartEffect } = useApp();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Memory form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('Photos');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    setIsLoading(true);
    memoryService.getMemories(selectedCategory)
      .then(res => {
        setMemories(res.data ?? []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    const unsubscribe = memoryService.subscribe(updated => {
      if (selectedCategory === 'All') setMemories(updated);
      else setMemories(updated.filter(m => m.category === selectedCategory));
    });
    return () => unsubscribe();
  }, [selectedCategory]);

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
    const cover = newCoverUrl || 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80';

    await memoryService.createMemory({
      title: newTitle.trim(),
      description: newDescription.trim(),
      date: new Date(newDate).toISOString(),
      location: newLocation.trim() || undefined,
      category: newCategory,
      coverUrl: cover,
      mediaUrls: [cover],
      tags: tagsArray.length > 0 ? tagsArray : ['Us', 'Memory'],
      isFavorite: false,
      addedById: user.id,
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewLocation('');
    setNewCoverUrl('');
    setNewTags('');
  };

  const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await memoryService.toggleFavorite(id);
    triggerHeartEffect();
  };

  const filteredMemories = memories.filter(m => {
    const matchesSearch = searchQuery
      ? m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesSearch;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8 py-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <Camera className="h-3.5 w-3.5 text-white" />
            <span>Encrypted Vault</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Memory Vault</h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            Every snapshot, trip, and precious memory preserved forever
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Preserve Memory
          </button>
        </div>
      </div>

      {/* Category Pills & Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2">
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

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#666666]" />
          <input
            type="text"
            placeholder="Search memories, tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="clay-input w-full h-9 pl-9 pr-3 text-xs placeholder-[#666666]"
          />
        </div>
      </div>

      {/* Memories Grid Gallery */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-3xl overflow-hidden border border-white/5 bg-[#0F0F0F] p-4 space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMemories.length === 0 ? (
        <EmptyState
          icon={<Camera className="h-6 w-6" />}
          title="No memories yet in this category"
          description="Let's capture our first special moment and keep it safe in our digital home."
          actionText="Add New Memory"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map(memory => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="clay-card-interactive group relative rounded-3xl overflow-hidden flex flex-col justify-between border border-white/10 bg-[#0F0F0F] cursor-pointer"
              onClick={() => openMediaViewer(memory.mediaUrls, 0, {
                title: memory.title,
                description: memory.description,
                location: memory.location,
                date: formatDate(memory.date, 'medium')
              })}
            >
              {/* Media Thumbnail */}
              <div className="relative h-60 w-full overflow-hidden bg-black/40">
                <img
                  src={memory.coverUrl}
                  alt={memory.title}
                  className="h-full w-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-black/30" />

                {/* Favorite badge trigger */}
                <button
                  onClick={(e) => handleToggleFavorite(e, memory.id)}
                  aria-label="Toggle favorite"
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 border border-white/15 text-white hover:scale-110 active:scale-90 transition-transform"
                >
                  <Heart className={`h-4 w-4 ${memory.isFavorite ? 'fill-white text-white' : 'text-[#AAAAAA]'}`} />
                </button>

                {/* Category Pill */}
                <div className="absolute top-3 left-3">
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono text-[#E5E5E5] border border-white/10">
                    {memory.category}
                  </span>
                </div>
              </div>

              {/* Memory Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-serif text-lg text-white font-normal line-clamp-1 group-hover:underline">
                    {memory.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#777777] font-light line-clamp-2 leading-relaxed">
                    {memory.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#666666]">
                    {memory.location ? (
                      <span className="flex items-center gap-1 line-clamp-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {memory.location}
                      </span>
                    ) : <span />}
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="h-3 w-3" />
                      {formatDate(memory.date, 'short')}
                    </span>
                  </div>

                  {/* Tags */}
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {memory.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono text-[#555555] bg-white/5 px-2 py-0.5 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CREATE MEMORY MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Preserve a New Memory"
        description="Store this moment in our vault with location, tags, and photos."
      >
        <form onSubmit={handleCreateMemory} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Title of Memory</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Sunrise Chai in the Valley"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as MemoryCategory)}
                className="clay-input w-full h-10 px-3 text-xs bg-[#0D0D0D]"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c} className="bg-[#111111]">{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Location</label>
            <input
              type="text"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              placeholder="e.g. Pahalgam Valley, Kashmir"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Cover Photo URL</label>
            <input
              type="text"
              value={newCoverUrl}
              onChange={e => setNewCoverUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Story / Notes</label>
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="What made this moment unforgettable..."
              rows={3}
              className="clay-input w-full p-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Tags (comma separated)</label>
            <input
              type="text"
              value={newTags}
              onChange={e => setNewTags(e.target.value)}
              placeholder="Kashmir, Chai, Mountains"
              className="clay-input w-full h-10 px-3 text-xs"
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
              Save to Vault
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
