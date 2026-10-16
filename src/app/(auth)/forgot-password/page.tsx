'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Mail, ArrowLeft, Check } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 text-[#E5E5E5] select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0C0C0C] p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)] space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#252525] to-[#121212] border border-white/20 shadow-lg">
            <Heart className="h-6 w-6 fill-white text-white" />
          </div>
          <h1 className="font-serif text-2xl text-white font-light">
            Sanctuary Recovery
          </h1>
          <p className="text-xs text-[#777777] font-light">
            Enter your coupled email address to receive reset instructions.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
              <Check className="h-5 w-5" />
            </div>
            <p className="text-xs text-[#CCCCCC]">
              We have sent recovery link instructions to <span className="text-white font-mono">{email}</span>.
            </p>
            <Link
              href="/login"
              className="clay-btn clay-btn-primary w-full py-2.5 text-xs inline-block"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#AAAAAA]">Couple Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#666666]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="us@sanctuary.private"
                  className="clay-input w-full h-11 pl-10 pr-3 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="clay-btn clay-btn-primary w-full py-3 text-xs font-medium mt-2"
            >
              Send Recovery Link
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-[#777777] hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
