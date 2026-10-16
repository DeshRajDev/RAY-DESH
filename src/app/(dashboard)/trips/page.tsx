'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Compass, MapPin, Calendar, Camera, ArrowRight, Clock, Map } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Trip } from '@/types';
import { tripService } from '@/services/trip.service';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/date-utils';

export default function TripsPage() {
  const { user } = useApp();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'planning'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Trip state
  const [newTitle, setNewTitle] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newStart, setNewStart] = useState(new Date().toISOString().slice(0, 10));
  const [newEnd, setNewEnd] = useState(new Date().toISOString().slice(0, 10));
  const [newCover, setNewCover] = useState('');
  const [newStatus, setNewStatus] = useState<Trip['status']>('planning');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    tripService.getTrips().then(res => setTrips(res.data));
    const unsubscribe = tripService.subscribe(updated => setTrips(updated));
    return () => unsubscribe();
  }, []);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDestination.trim()) return;

    await tripService.createTrip({
      title: newTitle.trim(),
      destination: newDestination.trim(),
      country: newCountry.trim() || 'Worldwide',
      startDate: new Date(newStart).toISOString(),
      endDate: new Date(newEnd).toISOString(),
      coverPhoto: newCover || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      locations: [
        { id: `loc_${Date.now()}`, name: newDestination }
      ],
      photos: [newCover || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'],
      notes: newNotes.trim() || undefined,
      status: newStatus,
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDestination('');
    setNewCountry('');
    setNewCover('');
    setNewNotes('');
  };

  const filteredTrips = selectedStatus === 'all'
    ? trips
    : trips.filter(t => t.status === selectedStatus);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <Compass className="h-3.5 w-3.5 text-white" />
            <span>Shared Travel Journal</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Trips &amp; Journeys</h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            Every road trip, mountain getaway, and international adventure we share
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Plan New Trip
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`clay-pill ${selectedStatus === 'all' ? 'active' : 'text-[#888888] hover:text-white'}`}
        >
          All Expeditions ({trips.length})
        </button>
        <button
          onClick={() => setSelectedStatus('completed')}
          className={`clay-pill ${selectedStatus === 'completed' ? 'active' : 'text-[#888888] hover:text-white'}`}
        >
          Completed Journeys
        </button>
        <button
          onClick={() => setSelectedStatus('planning')}
          className={`clay-pill ${selectedStatus === 'planning' ? 'active' : 'text-[#888888] hover:text-white'}`}
        >
          Upcoming / Planning
        </button>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTrips.map(trip => (
          <Link
            key={trip.id}
            href={`/trips/${trip.id}`}
            className="clay-card-interactive group rounded-3xl overflow-hidden border border-white/10 bg-[#0F0F0F] flex flex-col justify-between"
          >
            {/* Cover Image */}
            <div className="relative h-60 w-full bg-black">
              <img
                src={trip.coverPhoto}
                alt={trip.title}
                className="h-full w-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-black/30" />

              <span className="absolute top-4 left-4 rounded-full bg-black/60 backdrop-blur-md px-3 py-0.5 text-[10px] font-mono uppercase text-white border border-white/10">
                {trip.status}
              </span>
            </div>

            {/* Trip Details */}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#AAAAAA] mb-1">
                  <MapPin className="h-3.5 w-3.5 text-white" />
                  <span>{trip.destination}, {trip.country}</span>
                </div>
                <h3 className="font-serif text-2xl text-white font-normal group-hover:underline">
                  {trip.title}
                </h3>
              </div>

              {trip.notes && (
                <p className="text-xs text-[#777777] font-light line-clamp-2 leading-relaxed">
                  {trip.notes}
                </p>
              )}

              {/* Itinerary Spot count */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs font-mono text-[#666666]">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(trip.startDate, 'short')} – {formatDate(trip.endDate, 'short')}
                </span>
                <span className="flex items-center gap-1 text-white group-hover:translate-x-1 transition-transform">
                  Explore Itinerary <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* PLAN TRIP MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Plan an Adventure Together"
        description="Add dates, destinations, and packing dreams."
      >
        <form onSubmit={handleCreateTrip} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Trip Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Amalfi Coast Clifftop Escapade"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Destination</label>
              <input
                type="text"
                required
                value={newDestination}
                onChange={e => setNewDestination(e.target.value)}
                placeholder="e.g. Positano & Amalfi"
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
              <label className="text-xs text-[#AAAAAA]">Start Date</label>
              <input
                type="date"
                value={newStart}
                onChange={e => setNewStart(e.target.value)}
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">End Date</label>
              <input
                type="date"
                value={newEnd}
                onChange={e => setNewEnd(e.target.value)}
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Status</label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as Trip['status'])}
              className="clay-input w-full h-10 px-3 text-xs bg-[#0D0D0D]"
            >
              <option value="planning">Planning</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Cover Photo URL</label>
            <input
              type="text"
              value={newCover}
              onChange={e => setNewCover(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Travel Notes &amp; Itinerary Ideas</label>
            <textarea
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="Packing list, romantic spots to see..."
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
              Save Trip
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
