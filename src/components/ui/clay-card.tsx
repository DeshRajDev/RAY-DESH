'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ClayCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  elevation?: 'flat' | 'raised' | 'floating';
  className?: string;
}

export function ClayCard({
  children,
  interactive = false,
  elevation = 'raised',
  className,
  ...props
}: ClayCardProps) {
  const elevationStyles = {
    flat: 'border border-white/5 bg-[#0C0C0C]',
    raised: 'clay-card',
    floating: 'clay-card shadow-[0_25px_50px_-12px_rgba(0,0,0,0.95)]',
  };

  return (
    <div
      className={cn(
        elevationStyles[elevation],
        interactive && 'clay-card-interactive cursor-pointer',
        'p-6 text-[#E5E5E5]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'pill';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export function ClayButton({
  variant = 'secondary',
  size = 'md',
  children,
  className,
  ...props
}: ClayButtonProps) {
  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
    icon: 'h-10 w-10 p-0',
  };

  const variantStyles = {
    primary: 'clay-btn-primary font-medium tracking-wide',
    secondary: 'clay-btn-secondary',
    danger: 'clay-btn-danger',
    ghost: 'bg-transparent text-[#AAAAAA] hover:text-white hover:bg-white/5 border border-transparent',
    pill: 'clay-pill',
  };

  return (
    <button
      className={cn(
        'clay-btn inline-flex items-center justify-center gap-2',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
