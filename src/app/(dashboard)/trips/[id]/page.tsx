'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Compass, Camera, Heart, Plus } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Trip } from '@/types';
import { tripService } from '@/services/trip.service';
import { formatDate } from '@/lib/date-utils';

export default function TripDetailPage() {
  const params = useParams();
  const { openMediaViewer } = useApp();
  const [trip, setTrip] = useState<Trip | null>(null);

  const tripId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (tripId) {
      tripService.getTripById(tripId).then(res => setTrip(res.data));
    }
  }, [tripId]);

  if (!trip) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-8 py-12 text-center text-[#777777]">
        Loading trip details...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 space-y-6">
      {/* Back button */}
      <Link
        href="/trips"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#777777] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Trips
      </Link>

      {/* Hero Cover */}
      <div className="relative h-80 sm:h-96 w-full rounded-3xl overflow-hidden border border-white/10 bg-black">
        <img
          src={trip.coverPhoto}
          alt={trip.title}
          className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="rounded-full bg-white/10 backdrop-blur-md px-3 py-0.5 text-[10px] font-mono uppercase text-white">
              {trip.status}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-white font-light">
              {trip.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#AAAAAA] font-light flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-white" />
              {trip.destination}, {trip.country}
            </p>
          </div>

          <div className="text-xs font-mono text-[#AAAAAA] bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
            {formatDate(trip.startDate, 'medium')} – {formatDate(trip.endDate, 'medium')}
          </div>
        </div>
      </div>

      {/* Trip Itinerary Stops & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stops column */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-serif text-xl text-white font-normal">Visited &amp; Planned Stops</h3>

          <div className="space-y-3">
            {trip.locations.map((loc, idx) => (
              <div
                key={loc.id}
                className="clay-card p-5 rounded-2xl border border-white/10 bg-[#0F0F0F] flex items-start gap-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-mono text-white">
                  {idx + 1}
                </span>
                <div className="space-y-1 min-w-0">
                  <h4 className="font-serif text-base text-white">{loc.name}</h4>
                  {loc.date && (
                    <span className="text-[11px] font-mono text-[#777777] block">
                      Visited on {loc.date}
                    </span>
                  )}
                  {loc.notes && (
                    <p className="text-xs text-[#AAAAAA] font-light leading-relaxed">
                      {loc.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Photo gallery */}
          {trip.photos && trip.photos.length > 0 && (
            <div className="pt-4 space-y-3">
              <h3 className="font-serif text-xl text-white font-normal">Trip Snapshots</h3>
              <div className="grid grid-cols-2 gap-3">
                {trip.photos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt="Trip photo"
                    onClick={() => openMediaViewer(trip.photos, i, { title: trip.title })}
                    className="h-44 w-full rounded-2xl object-cover grayscale hover:grayscale-0 cursor-pointer border border-white/10 transition-all duration-300"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Travel Notes & Tips Sidebar */}
        <div className="clay-card p-6 rounded-3xl border border-white/10 bg-[#0F0F0F] space-y-4 h-fit">
          <h4 className="font-serif text-lg text-white font-normal">Travel Notes</h4>
          <p className="text-xs text-[#888888] font-light leading-relaxed whitespace-pre-wrap">
            {trip.notes || 'No packing notes added yet.'}
          </p>

          <div className="pt-4 border-t border-white/5 space-y-2 text-xs font-mono text-[#666666]">
            <div>Status: <span className="text-white capitalize">{trip.status}</span></div>
            <div>Stops: <span className="text-white">{trip.locations.length} locations</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
