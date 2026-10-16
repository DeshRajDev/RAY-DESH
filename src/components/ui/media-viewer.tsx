'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Download, Share2, ZoomIn, ZoomOut, Calendar, MapPin } from 'lucide-react';
import { useApp } from '@/stores/app-context';

export function MediaViewer() {
  const { activeMedia, closeMediaViewer, triggerHeartEffect } = useApp();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeMedia) {
      setCurrentIndex(activeMedia.currentIndex || 0);
      setZoomLevel(1);
    }
  }, [activeMedia]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeMedia) return;
      if (e.key === 'Escape') closeMediaViewer();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMedia, currentIndex]);

  if (!activeMedia || !activeMedia.urls || activeMedia.urls.length === 0) return null;

  const currentUrl = activeMedia.urls[currentIndex] || activeMedia.urls[0];

  const handleNext = () => {
    setZoomLevel(1);
    setCurrentIndex(prev => (prev + 1) % activeMedia.urls.length);
  };

  const handlePrev = () => {
    setZoomLevel(1);
    setCurrentIndex(prev => (prev - 1 + activeMedia.urls.length) % activeMedia.urls.length);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.3, 1));

  return (
    <AnimatePresence>
      {activeMedia.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl select-none"
        >
          {/* Top Control Bar */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-white/10 z-20">
            <div className="flex items-center gap-3">
              <span className="font-serif text-sm tracking-wide text-white">
                {activeMedia.title || 'Private Vault Item'}
              </span>
              {activeMedia.urls.length > 1 && (
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-mono text-[#AAAAAA]">
                  {currentIndex + 1} / {activeMedia.urls.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomIn}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#181818] border border-white/10 text-[#AAAAAA] hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#181818] border border-white/10 text-[#AAAAAA] hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  triggerHeartEffect(e.clientX, e.clientY);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#181818] border border-white/10 text-[#AAAAAA] hover:text-white"
                title="Favorite"
              >
                <Heart className="h-4 w-4" />
              </button>
              <button
                onClick={closeMediaViewer}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222222] border border-white/15 text-white hover:bg-white hover:text-black transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Media Center Viewport */}
          <div className="relative flex flex-1 items-center justify-center p-4 sm:p-8 overflow-hidden">
            {/* Prev button */}
            {activeMedia.urls.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 border border-white/20 text-white hover:bg-white hover:text-black transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Main Image */}
            <motion.div
              key={currentUrl}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: zoomLevel }}
              transition={{ duration: 0.2 }}
              className="relative max-h-full max-w-full flex items-center justify-center"
            >
              <img
                src={currentUrl}
                alt={activeMedia.title || 'Memory item'}
                className="max-h-[75vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl border border-white/10"
              />
            </motion.div>

            {/* Next button */}
            {activeMedia.urls.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 border border-white/20 text-white hover:bg-white hover:text-black transition-all"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom Info Bar */}
          {(activeMedia.description || activeMedia.location || activeMedia.date) && (
            <div className="border-t border-white/10 bg-[#0A0A0A] p-4 sm:p-6 z-20 max-w-2xl mx-auto w-full text-center">
              {activeMedia.description && (
                <p className="text-sm font-light text-[#E5E5E5] leading-relaxed">
                  {activeMedia.description}
                </p>
              )}
              <div className="mt-2 flex items-center justify-center gap-4 text-xs font-mono text-[#777777]">
                {activeMedia.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {activeMedia.location}
                  </span>
                )}
                {activeMedia.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {activeMedia.date}
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
