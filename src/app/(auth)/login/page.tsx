'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, Phone, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/auth.service';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect partner based on entered phone/email
  const detectedPartner = authService.identifyAccount(identifier);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your phone number or email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.loginWithCredentials(identifier, password);
      if (!res.success) {
        const msg = typeof res.error === 'string' ? res.error : res.error?.message || res.message || 'Invalid credentials. Access denied.';
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }

      router.replace('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 text-[#E5E5E5] select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0C0C0C] p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)] space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#252525] to-[#121212] border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <Heart className="h-7 w-7 fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl text-white font-light tracking-tight">
              Ray
            </h1>
            <span className="text-lg sm:text-xl text-white/40 font-light">—</span>
            <span className="text-xl sm:text-2xl text-white/90 font-normal">
              किरण
            </span>
          </div>
          <p className="text-xs text-[#888888] font-light">
            Enter your phone number or email and password to enter Ray — किरण.
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleFormLogin} className="space-y-4 pt-1">
          {/* Error message alert */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Identifier Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase text-[#AAAAAA]">
              Phone Number or Email
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
              <input
                type="text"
                required
                value={identifier}
                onChange={e => {
                  setIdentifier(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="e.g. Phone Number or email"
                className="clay-input w-full h-11 pl-10 pr-3 text-xs text-white"
              />
            </div>
            {detectedPartner && (
              <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 pl-1">
                <span>Recognized partner:</span>
                <strong className="text-white uppercase">{detectedPartner === 'desh' ? 'Desh (Partner 1)' : 'Rey (Partner 2)'}</strong>
              </div>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase text-[#AAAAAA]">
                Sanctuary Password
              </label>
              <span className="text-[10px] text-[#777777] font-mono">
                Required for access
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Enter password..."
                className="clay-input w-full h-11 pl-10 pr-10 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#666666] hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="clay-btn clay-btn-primary w-full py-3 text-xs font-medium flex items-center justify-center gap-2 mt-4 shadow-lg"
          >
            <span>{isLoading ? 'Verifying Credentials...' : 'Unlock Sanctuary'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Sanctuary Milestone Footnote */}
        <div className="p-3 rounded-2xl bg-[#090909] border border-white/5 text-[11px] text-[#777777] font-mono space-y-1 text-center">
          <div>❤️ Talking since: <strong className="text-white">Sep 24, 2026</strong></div>
          <div>💍 Relationship anniversary: <strong className="text-white">Sep 27, 2026</strong></div>
        </div>
      </motion.div>
    </div>
  );
}
