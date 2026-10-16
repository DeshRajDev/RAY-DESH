'use client';

import React, { useState } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Lock, Bell, Volume2, Shield, Download, Heart, LogOut, Check } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { userService } from '@/services/user.service';

export default function SettingsPage() {
  const { couple, theme, setTheme, triggerHeartEffect } = useApp();
  const [soundEnabled, setSoundEnabled] = useState(couple.soundEnabled);
  const [pinEnabled, setPinEnabled] = useState(couple.privacyPinEnabled);
  const [customTitle, setCustomTitle] = useState(couple.customTitle);
  const [startDate, setStartDate] = useState(couple.relationshipStartDate.slice(0, 10));
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await userService.updateCoupleSettings({
      customTitle,
      relationshipStartDate: new Date(startDate).toISOString(),
      soundEnabled,
      privacyPinEnabled: pinEnabled,
    });
    setIsSaved(true);
    triggerHeartEffect();
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
          <SettingsIcon className="h-3.5 w-3.5 text-white" />
          <span>Preferences &amp; Security</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">App Settings</h1>
        <p className="text-xs sm:text-sm text-[#777777] font-light">
          Customize your monochrome theme, relationship timer origin, and privacy controls
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. Theme & Appearance (Strictly Grayscale) */}
        <div className="clay-card p-6 rounded-3xl border border-white/10 bg-[#0F0F0F] space-y-4">
          <h3 className="font-serif text-lg text-white">Theme &amp; Appearance</h3>
          <p className="text-xs text-[#777777] font-light">
            Choose your monochrome visual mood. Both options maintain the pure black, white and grayscale palette.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                theme === 'dark'
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-[#141414] text-[#888888] border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5" />
                <div>
                  <div className="text-sm font-medium">Obsidian Dark (Default)</div>
                  <div className="text-[11px] opacity-70">Deep blacks and soft highlights</div>
                </div>
              </div>
              {theme === 'dark' && <Check className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                theme === 'light'
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-[#141414] text-[#888888] border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun className="h-5 w-5" />
                <div>
                  <div className="text-sm font-medium">Silver Light</div>
                  <div className="text-[11px] opacity-70">Clean monochrome paper aesthetics</div>
                </div>
              </div>
              {theme === 'light' && <Check className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* 2. Relationship Info & Anniversary */}
        <div className="clay-card p-6 rounded-3xl border border-white/10 bg-[#0F0F0F] space-y-4">
          <h3 className="font-serif text-lg text-white">Relationship Milestone Origin</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Sanctuary Name / Custom Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Relationship Start Date (Live Timer Origin)</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
          </div>
        </div>

        {/* 3. Sound & Tactile Interactions */}
        <div className="clay-card p-6 rounded-3xl border border-white/10 bg-[#0F0F0F] space-y-4">
          <h3 className="font-serif text-lg text-white">Microinteractions &amp; Privacy</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141414] border border-white/5">
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-white" />
                <div>
                  <div className="text-xs text-white">Tactile Sounds &amp; Floating Hearts</div>
                  <div className="text-[10px] text-[#777777]">Micro-animations when sending reactions and love</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={e => setSoundEnabled(e.target.checked)}
                className="rounded bg-[#222222]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141414] border border-white/5">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-white" />
                <div>
                  <div className="text-xs text-white">Biometric / PIN Passcode Lock</div>
                  <div className="text-[10px] text-[#777777]">Require 4-digit PIN when opening app</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={e => setPinEnabled(e.target.checked)}
                className="rounded bg-[#222222]"
              />
            </div>
          </div>
        </div>

        {/* 4. Sanctuary Data & Cache Management */}
        <div className="clay-card p-6 rounded-3xl border border-white/10 bg-[#0F0F0F] space-y-4">
          <h3 className="font-serif text-lg text-white">Sanctuary Data &amp; Cache</h3>
          <p className="text-xs text-[#777777] font-light">
            Clear locally cached sanctuary data to reload fresh dates and memory state from seed.
          </p>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141414] border border-white/5">
            <div>
              <div className="text-xs text-white font-medium">Reset Local Sanctuary Cache</div>
              <div className="text-[10px] text-[#777777]">Clears saved browser state and resets to pristine milestone dates</div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-white/15 hover:bg-white/10 text-white transition-colors"
            >
              Clear Cache &amp; Refresh
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <Check className="h-4 w-4" /> Preferences Saved with Love
            </span>
          ) : <span />}

          <button
            type="submit"
            className="clay-btn clay-btn-primary px-7 py-2.5 text-xs font-medium"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
