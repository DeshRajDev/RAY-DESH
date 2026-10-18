'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className,
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative w-full max-h-[90dvh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0E0E0E] p-5 sm:p-8',
              'shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)]',
              'z-10 my-auto text-[#E5E5E5]',
              maxWidthClasses[maxWidth],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4">
              <div>
                {title && (
                  <h3 className="font-serif text-xl sm:text-2xl font-light text-white tracking-tight">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-1 text-xs text-[#777777] font-light leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#181818] border border-white/10 text-[#777777] hover:text-white hover:border-white/20 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="pt-2">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('clay-card flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#181818] border border-white/10 text-[#AAAAAA] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
          {icon}
        </div>
      )}
      <h4 className="font-serif text-lg sm:text-xl font-normal text-white">{title}</h4>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-[#777777] font-light leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="clay-btn clay-btn-secondary mt-6 px-5 py-2 text-xs font-medium"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
