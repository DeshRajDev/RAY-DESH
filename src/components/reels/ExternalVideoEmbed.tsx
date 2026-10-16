'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Play, RefreshCw, AlertCircle, Film } from 'lucide-react';
import { ReelPlatform } from '@/types';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface ExternalVideoEmbedProps {
  url: string;
  platform?: ReelPlatform;
  shortcode?: string;
  title?: string;
  autoLoad?: boolean;
}

export function ExternalVideoEmbed({
  url,
  platform = 'instagram',
  shortcode: initialShortcode,
  title,
  autoLoad = false,
}: ExternalVideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract platform and shortcode if not provided
  const detectedPlatform: ReelPlatform = platform || (url.includes('facebook.com') || url.includes('fb.watch') ? 'facebook' : 'instagram');
  
  let shortcode = initialShortcode;
  let isPost = false;

  if (!shortcode && url) {
    if (url.includes('/p/')) {
      const pMatch = url.match(/\/p\/([a-zA-Z0-9_-]+)/i);
      if (pMatch) {
        shortcode = pMatch[1];
        isPost = true;
      }
    } else {
      const rMatch = url.match(/\/(?:reel|reels)\/([a-zA-Z0-9_-]+)/i);
      if (rMatch) {
        shortcode = rMatch[1];
      }
    }
  } else if (url.includes('/p/')) {
    isPost = true;
  }

  // Determine official embed source URL
  let embedSrc = '';
  if (detectedPlatform === 'instagram' && shortcode) {
    embedSrc = isPost 
      ? `https://www.instagram.com/p/${shortcode}/embed/`
      : `https://www.instagram.com/reel/${shortcode}/embed/`;
  } else if (detectedPlatform === 'facebook') {
    embedSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=500`;
  }

  // Intersection observer for lazy loading
  useEffect(() => {
    if (autoLoad) {
      setIsLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Wait slightly or allow user to click, or automatically prime
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [autoLoad]);

  const handleRetry = () => {
    setHasError(false);
    setIsIframeReady(false);
    setRetryCount((prev) => prev + 1);
  };

  const handleManualPlay = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[9/16] max-h-[560px] min-h-[420px] rounded-2xl bg-[#0A0A0A] border border-white/10 overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center select-none group"
    >
      {/* 1. If not yet loaded / Click to Play Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#141414] via-[#0C0C0C] to-[#080808] z-10">
          <div className="relative mb-5">
            <div className="absolute -inset-2 rounded-full bg-white/5 blur-md group-hover:bg-white/10 transition-all" />
            <button
              onClick={handleManualPlay}
              aria-label="Load video embed player"
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A1A1A] border border-white/20 text-white shadow-[0_8px_24px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="h-7 w-7 text-white fill-white translate-x-0.5" />
            </button>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider text-[#AAAAAA] bg-white/5 border border-white/10 mb-2">
            {detectedPlatform === 'instagram' ? <InstagramIcon className="h-3 w-3 text-white" /> : <Film className="h-3 w-3 text-white" />}
            {detectedPlatform} {isPost ? 'Post' : 'Reel'}
          </span>

          <p className="text-xs text-[#888888] max-w-[220px] line-clamp-2 mb-4 font-light">
            {title || 'Click to launch official embedded player'}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualPlay}
              className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-medium shadow-md hover:bg-[#E5E5E5] transition-all"
            >
              Load Player
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-[#AAAAAA] hover:text-white transition-all"
            >
              <span>Source</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* 2. Loading Skeleton while iframe is loading */}
      {isLoaded && !isIframeReady && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0C0C0C] z-10 animate-pulse">
          <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin mb-3" />
          <p className="text-xs font-mono text-[#888888]">Connecting to official player...</p>
        </div>
      )}

      {/* 3. Error / Fallback State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#111111] z-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-[#AAAAAA] mb-3">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <h4 className="font-serif text-sm text-white mb-1">Playback Unavailable Here</h4>
          <p className="text-xs text-[#888888] mb-4 font-light leading-relaxed max-w-[240px]">
            Can&apos;t play this {detectedPlatform === 'instagram' ? 'Reel' : 'video'} here? The external platform may have privacy or browser restrictions.
          </p>

          <div className="flex flex-col gap-2 w-full max-w-[220px]">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-white text-black text-xs font-medium shadow-[0_4px_12px_rgba(255,255,255,0.2)] hover:bg-[#E5E5E5] transition-all"
            >
              <span>Open on {detectedPlatform === 'instagram' ? 'Instagram' : 'Facebook'}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl bg-[#1A1A1A] border border-white/10 text-xs text-[#AAAAAA] hover:text-white transition-all"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Try Loading Again</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Official Iframe Render */}
      {isLoaded && embedSrc && !hasError && (
        <iframe
          key={`${embedSrc}-${retryCount}`}
          src={embedSrc}
          title={title || `${detectedPlatform} Reel Player`}
          className={`w-full h-full border-0 transition-opacity duration-300 ${
            isIframeReady ? 'opacity-100' : 'opacity-0'
          }`}
          allowTransparency={true}
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          onLoad={() => {
            setIsIframeReady(true);
          }}
          onError={() => {
            setHasError(true);
          }}
        />
      )}
    </div>
  );
}
