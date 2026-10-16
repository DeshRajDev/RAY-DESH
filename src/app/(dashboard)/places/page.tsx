'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Compass, Star, Heart, Camera, Calendar, Map as MapIcon } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Place } from '@/types';
import { placeService } from '@/services/place.service';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/date-utils';

export default function PlacesPage() {
  const { user, openMediaViewer, triggerHeartEffect } = useApp();
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeTab, setActiveTab] = useState<'Been' | 'WantToGo'>('Been');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activePlacePreview, setActivePlacePreview] = useState<Place | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newCat, setNewCat] = useState<'Been' | 'WantToGo'>('Been');
  const [newNotes, setNewNotes] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [newVisitedDate, setNewVisitedDate] = useState('');

  useEffect(() => {
    placeService.getPlaces(activeTab).then(res => setPlaces(res.data));
    const unsubscribe = placeService.subscribe(updated => {
      setPlaces(updated.filter(p => p.category === activeTab));
    });
    return () => unsubscribe();
  }, [activeTab]);

  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCity.trim()) return;

    await placeService.addPlace({
      name: newName.trim(),
      city: newCity.trim(),
      country: newCountry.trim() || 'Worldwide',
      category: newCat,
      photos: [newPhoto || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'],
      notes: newNotes.trim() || undefined,
      dateVisited: newVisitedDate ? new Date(newVisitedDate).toISOString() : undefined,
      isFavorite: false,
      rating: 5,
      addedById: user.id,
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewCity('');
    setNewCountry('');
    setNewNotes('');
    setNewPhoto('');
  };

  const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await placeService.toggleFavorite(id);
    triggerHeartEffect();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <MapPin className="h-3.5 w-3.5 text-white" />
            <span>Geo Sanctuary</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Places</h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            Pinning everywhere we have walked and everywhere we yearn to explore
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Location
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('Been')}
          className={`clay-pill ${activeTab === 'Been' ? 'active' : 'text-[#888888] hover:text-white'}`}
        >
          Places We&apos;ve Been
        </button>
        <button
          onClick={() => setActiveTab('WantToGo')}
          className={`clay-pill ${activeTab === 'WantToGo' ? 'active' : 'text-[#888888] hover:text-white'}`}
        >
          Places We Want To Go
        </button>
      </div>

      {/* Interactive Dark World Map Placeholder */}
      <div className="relative h-64 sm:h-80 w-full rounded-3xl overflow-hidden border border-white/10 bg-[#0A0A0A] shadow-inner p-6 flex flex-col justify-between">
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 bg-[radial-gradient(#222222_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-[#AAAAAA]">
            <MapIcon className="h-4 w-4 text-white" />
            <span>Interactive Couple Map Pinboard</span>
          </div>
          <span className="text-[10px] font-mono text-[#666666]">
            {places.length} pins plotted in {activeTab === 'Been' ? 'Visited' : 'Wishlist'}
          </span>
        </div>

        {/* Pinned Spot Bubbles on Canvas */}
        <div className="relative z-10 flex flex-wrap gap-3 my-auto">
          {places.map((place, idx) => (
            <motion.button
              key={place.id}
              onClick={() => setActivePlacePreview(place)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-2xl bg-[#161616] border border-white/15 px-3.5 py-2 shadow-lg hover:border-white text-left transition-all"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black text-xs font-serif">
                {idx + 1}
              </div>
              <div>
                <span className="font-serif text-xs text-white block line-clamp-1">{place.name}</span>
                <span className="text-[10px] font-mono text-[#777777]">{place.city}, {place.country}</span>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="relative z-10 text-[10px] font-mono text-[#555555]">
          Ready to connect to Mapbox or Leaflet API
        </div>
      </div>

      {/* Places Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {places.map(place => (
          <div
            key={place.id}
            className="clay-card-interactive group rounded-3xl overflow-hidden border border-white/10 bg-[#0F0F0F] flex flex-col justify-between"
          >
            {/* Image */}
            <div className="relative h-48 w-full bg-black">
              <img
                src={place.photos[0]}
                alt={place.name}
                onClick={() => openMediaViewer(place.photos, 0, { title: place.name, description: place.notes })}
                className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 cursor-pointer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-black/30 pointer-events-none" />

              <button
                onClick={(e) => handleToggleFavorite(e, place.id)}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center text-white"
              >
                <Heart className={`h-4 w-4 ${place.isFavorite ? 'fill-white text-white' : 'text-[#AAAAAA]'}`} />
              </button>

              <div className="absolute top-3 left-3">
                <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono text-white border border-white/10">
                  {place.city}, {place.country}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-3">
              <div>
                <h3 className="font-serif text-lg text-white font-normal">{place.name}</h3>
                {place.notes && (
                  <p className="mt-1 text-xs text-[#777777] font-light line-clamp-2 leading-relaxed">
                    {place.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-[#666666]">
                {place.dateVisited ? (
                  <span>Visited {formatDate(place.dateVisited, 'short')}</span>
                ) : (
                  <span>Wishlist item</span>
                )}

                <div className="flex items-center gap-1 text-white">
                  <Star className="h-3 w-3 fill-white" />
                  <span>{place.rating || 5}.0</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD PLACE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add a Destination"
        description="Mark where we walked or where we dream of going next."
      >
        <form onSubmit={handleCreatePlace} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Location Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Ponte Vecchio Bridge"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">City</label>
              <input
                type="text"
                required
                value={newCity}
                onChange={e => setNewCity(e.target.value)}
                placeholder="e.g. Florence"
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Country</label>
              <input
                type="text"
                value={newCountry}
                onChange={e => setNewCountry(e.target.value)}
                placeholder="e.g. Italy"
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Category</label>
              <select
                value={newCat}
                onChange={e => setNewCat(e.target.value as 'Been' | 'WantToGo')}
                className="clay-input w-full h-10 px-3 text-xs bg-[#0D0D0D]"
              >
                <option value="Been">Places We&apos;ve Been</option>
                <option value="WantToGo">Places We Want To Go</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Date Visited (if applicable)</label>
              <input
                type="date"
                value={newVisitedDate}
                onChange={e => setNewVisitedDate(e.target.value)}
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
            <label className="text-xs text-[#AAAAAA]">Personal Notes &amp; Memories</label>
            <textarea
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="What made this place special..."
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
              Save Pin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
