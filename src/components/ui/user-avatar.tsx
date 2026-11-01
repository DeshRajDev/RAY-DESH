'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/services/api/client';

export interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  isOnline?: boolean;
  showOnlineBadge?: boolean;
  alt?: string;
  role?: string;
}

const sizeClasses: Record<string, { box: string; text: string; badge: string }> = {
  xs: { box: 'h-5 w-5', text: 'text-[9px]', badge: 'h-1.5 w-1.5' },
  sm: { box: 'h-7 w-7', text: 'text-[11px]', badge: 'h-2 w-2' },
  md: { box: 'h-9 w-9', text: 'text-xs', badge: 'h-2.5 w-2.5' },
  lg: { box: 'h-11 w-11', text: 'text-sm', badge: 'h-3 w-3' },
  xl: { box: 'h-14 w-14', text: 'text-base font-medium', badge: 'h-3.5 w-3.5' },
  '2xl': { box: 'h-20 w-20', text: 'text-xl font-medium', badge: 'h-4 w-4' },
};

export function UserAvatar({
  src,
  name = 'Ray',
  size = 'md',
  className = '',
  isOnline = false,
  showOnlineBadge = false,
  alt,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if image src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeConfig = typeof size === 'string' ? sizeClasses[size] || sizeClasses.md : null;
  const customStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : undefined;

  const resolvedSrc = src ? ApiClient.resolveAssetUrl(src) : null;
  const initial = (name || 'R').trim().charAt(0).toUpperCase();

  const showFallback = !resolvedSrc || hasError;

  return (
    <div
      style={customStyle}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full select-none ${
        sizeConfig ? sizeConfig.box : ''
      } ${className}`}
    >
      {showFallback ? (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-[#2A2A2A] to-[#121212] text-white shadow-inner font-serif ${
            sizeConfig ? sizeConfig.text : 'text-xs'
          }`}
          title={name}
        >
          {initial}
        </div>
      ) : (
        <img
          src={resolvedSrc}
          alt={alt || name || 'User avatar'}
          onError={() => setHasError(true)}
          className="h-full w-full rounded-full object-cover border border-white/10 shadow-sm"
          loading="lazy"
        />
      )}

      {showOnlineBadge && isOnline && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 border-2 border-black ${
            sizeConfig ? sizeConfig.badge : 'h-2.5 w-2.5'
          }`}
        />
      )}
    </div>
  );
}
