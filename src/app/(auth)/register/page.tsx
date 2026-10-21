'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Lock, Mail, User as UserIcon, Calendar, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 text-[#E5E5E5] select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0C0C0C] p-5 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)] space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="relative mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#252525] to-[#121212] border border-white/20 shadow-lg">
            <img
              src="/icons/ray-logo-cute-web.png"
              alt="Ray"
              className="h-10 w-10 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
            />
          </div>
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="font-serif tracking-widest text-xs font-semibold text-white">Ray</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light tracking-tight">
            Create Our Space
          </h1>
          <p className="text-xs text-[#777777] font-light">
            Set up a private digital home exclusively for the two of you.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#AAAAAA]">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Desh"
                className="clay-input w-full h-11 px-3 text-xs text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#AAAAAA]">Partner Name</label>
              <input
                type="text"
                required
                value={partnerName}
                onChange={e => setPartnerName(e.target.value)}
                placeholder="Rey"
                className="clay-input w-full h-11 px-3 text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#AAAAAA]">Anniversary / Start Date</label>
            <input
              type="date"
              required
              value={anniversary}
              onChange={e => setAnniversary(e.target.value)}
              className="clay-input w-full h-11 px-3 text-xs text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#AAAAAA]">Shared Account Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="us@sanctuary.private"
              className="clay-input w-full h-11 px-3 text-xs text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#AAAAAA]">Passcode</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="clay-input w-full h-11 px-3 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            className="clay-btn clay-btn-primary w-full py-3 text-xs font-medium flex items-center justify-center gap-2 mt-4"
          >
            <span>Begin Our Journey</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-white/5 text-xs text-[#777777]">
          <span>Already have your sanctuary set up? </span>
          <Link href="/login" className="text-white hover:underline">
            Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
