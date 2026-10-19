'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User as UserIcon, 
  Heart, 
  Sparkles, 
  Music, 
  MapPin, 
  Cake, 
  Calendar, 
  Edit3, 
  Camera, 
  CheckSquare, 
  LogOut, 
  Upload, 
  ShieldCheck, 
  Key 
} from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { formatDate } from '@/lib/date-utils';
import { memoryService } from '@/services/memory.service';
import { musicService } from '@/services/music.service';
import { bucketListService } from '@/services/bucketList.service';
import { Modal } from '@/components/ui/modal';

export default function ProfilePage() {
  const { user, partner, couple, logout, updateUserProfile, triggerHeartEffect } = useApp();
  const [activeProfileTab, setActiveProfileTab] = useState<'me' | 'partner'>('me');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [memoriesCount, setMemoriesCount] = useState<number>(0);
  const [songsCount, setSongsCount] = useState<number>(0);
  const [bucketDone, setBucketDone] = useState<number>(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    memoryService.getMemories().then(res => setMemoriesCount(res.data?.length ?? 0));
    musicService.getSongs().then(res => setSongsCount(res.data?.length ?? 0));
    bucketListService.getItems().then(res => setBucketDone(res.data?.filter(b => b.isCompleted).length ?? 0));
  }, []);

  const currentViewUser = activeProfileTab === 'me' ? user : partner;

  // Edit fields
  const [editName, setEditName] = useState(user.name);
  const [editNickname, setEditNickname] = useState(user.nickname);
  const [editBio, setEditBio] = useState(user.bio);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [editStatus, setEditStatus] = useState(user.statusMessage || '');
  const [editFavoriteSong, setEditFavoriteSong] = useState(user.favoriteSong || '');
  const [editFavoritePlace, setEditFavoritePlace] = useState(user.favoritePlace || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleOpenEdit = () => {
    const target = activeProfileTab === 'me' ? user : partner;
    setEditName(target.name);
    setEditNickname(target.nickname);
    setEditBio(target.bio);
    setEditAvatar(target.avatar);
    setEditStatus(target.statusMessage || '');
    setEditFavoriteSong(target.favoriteSong || '');
    setEditFavoritePlace(target.favoritePlace || '');
    setIsEditModalOpen(true);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditAvatar(reader.result);
      }
      setIsUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUserId = activeProfileTab === 'me' ? user.id : partner.id;
    await updateUserProfile(targetUserId, {
      name: editName,
      nickname: editNickname,
      avatar: editAvatar,
      bio: editBio,
      statusMessage: editStatus,
      favoriteSong: editFavoriteSong,
      favoritePlace: editFavoritePlace,
    });
    setIsEditModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <UserIcon className="h-3.5 w-3.5 text-white" />
            <span>Identity &amp; Sanctuary Account</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">
            Profile &amp; Account
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Logout button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#141414] px-4 py-2 text-xs text-[#888888] hover:text-white hover:border-white/20 transition-all"
            title="Logout to Login Screen"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Profile Tab Toggle */}
      <div className="flex items-center gap-2 bg-[#121212] p-1.5 rounded-2xl border border-white/10 max-w-md">
        <button
          onClick={() => setActiveProfileTab('me')}
          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
            activeProfileTab === 'me'
              ? 'bg-white text-black shadow-md'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          {user.name} (Active Session)
        </button>
        <button
          onClick={() => setActiveProfileTab('partner')}
          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
            activeProfileTab === 'partner'
              ? 'bg-white text-black shadow-md'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          {partner.name} (Partner)
        </button>
      </div>

      {/* Hero Profile Card */}
      <div className="clay-card rounded-3xl p-6 sm:p-10 border border-white/10 bg-[#0F0F0F] shadow-xl space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="relative group">
            <img
              src={currentViewUser.avatar}
              alt={currentViewUser.name}
              className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl object-cover border-2 border-white/20 shadow-2xl group-hover:scale-102 transition-transform"
            />
            <button
              onClick={handleOpenEdit}
              className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs gap-1 transition-opacity backdrop-blur-xs"
              title="Change photo"
            >
              <Camera className="h-4 w-4" />
              <span>Change</span>
            </button>
            <button
              onClick={(e) => triggerHeartEffect(e.clientX, e.clientY)}
              className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-black border border-white/20 flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-transform shadow-lg"
              title="Send love"
            >
              <Heart className="h-4 w-4 fill-white" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="font-serif text-3xl text-white font-normal">
                    {currentViewUser.name}
                  </h2>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-mono text-[#AAAAAA] border border-white/5">
                    {currentViewUser.role === 'partner1' ? 'Partner 1' : 'Partner 2'}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#AAAAAA] block mt-0.5">
                  &ldquo;{currentViewUser.nickname}&rdquo;
                </span>
              </div>

              <button
                onClick={handleOpenEdit}
                className="clay-btn clay-btn-secondary px-4 py-2 text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto shadow-md"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile &amp; Avatar</span>
              </button>
            </div>

            {currentViewUser.statusMessage && (
              <p className="text-xs text-[#CCCCCC] bg-white/5 p-2.5 rounded-xl border border-white/5 font-mono">
                {currentViewUser.statusMessage}
              </p>
            )}

            <p className="text-sm text-[#888888] font-light leading-relaxed">
              {currentViewUser.bio}
            </p>
          </div>
        </div>

        {/* Quick Relationship Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-6 border-t border-white/5 text-center">
          <div className="p-2.5 sm:p-4 rounded-2xl bg-[#141414] border border-white/5">
            <span className="text-lg sm:text-2xl font-serif text-white">{memoriesCount}</span>
            <span className="text-[9px] sm:text-[10px] font-mono uppercase text-[#777777] block mt-0.5 truncate">Memories</span>
          </div>
          <div className="p-2.5 sm:p-4 rounded-2xl bg-[#141414] border border-white/5">
            <span className="text-lg sm:text-2xl font-serif text-white">{songsCount}</span>
            <span className="text-[9px] sm:text-[10px] font-mono uppercase text-[#777777] block mt-0.5 truncate">Songs</span>
          </div>
          <div className="p-2.5 sm:p-4 rounded-2xl bg-[#141414] border border-white/5">
            <span className="text-lg sm:text-2xl font-serif text-white">{bucketDone}</span>
            <span className="text-[9px] sm:text-[10px] font-mono uppercase text-[#777777] block mt-0.5 truncate">Dreams</span>
          </div>
        </div>

        {/* Favorite Things Details */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="font-serif text-lg text-white">Favorite Things &amp; Sanctuary Milestones</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#141414] border border-white/5 flex items-start gap-3">
              <Cake className="h-5 w-5 text-white shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase text-[#777777]">Birthday</span>
                <p className="text-xs text-white font-medium mt-0.5">
                  {formatDate(currentViewUser.birthday, 'long')}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141414] border border-white/5 flex items-start gap-3">
              <Calendar className="h-5 w-5 text-white shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase text-[#777777]">Official Anniversary</span>
                <p className="text-xs text-white font-medium mt-0.5">
                  September 27, 2026 (Talking since Sep 24)
                </p>
              </div>
            </div>

            {currentViewUser.favoriteSong && (
              <div className="p-4 rounded-2xl bg-[#141414] border border-white/5 flex items-start gap-3">
                <Music className="h-5 w-5 text-white shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#777777]">Favorite Song</span>
                  <p className="text-xs text-white font-medium mt-0.5">{currentViewUser.favoriteSong}</p>
                </div>
              </div>
            )}

            {currentViewUser.favoritePlace && (
              <div className="p-4 rounded-2xl bg-[#141414] border border-white/5 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-white shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#777777]">Favorite Place</span>
                  <p className="text-xs text-white font-medium mt-0.5">{currentViewUser.favoritePlace}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Profile (${activeProfileTab === 'me' ? user.name : partner.name})`}
        description="Update profile picture, nickname, bio, and favorite details."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Avatar upload / link */}
          <div className="space-y-2">
            <label className="text-xs text-[#AAAAAA]">Profile Picture</label>
            <div className="flex items-center gap-4">
              <img
                src={editAvatar}
                alt="Avatar preview"
                className="h-16 w-16 rounded-2xl object-cover border border-white/20"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="clay-btn clay-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Image File'}</span>
                </button>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={e => setEditAvatar(e.target.value)}
                  placeholder="Or paste direct image URL"
                  className="clay-input w-full h-8 px-2.5 text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Nickname</label>
              <input
                type="text"
                value={editNickname}
                onChange={e => setEditNickname(e.target.value)}
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Current Status / Mood Message</label>
            <input
              type="text"
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Bio</label>
            <textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              rows={3}
              className="clay-input w-full p-3 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Favorite Song</label>
              <input
                type="text"
                value={editFavoriteSong}
                onChange={e => setEditFavoriteSong(e.target.value)}
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#AAAAAA]">Favorite Place</label>
              <input
                type="text"
                value={editFavoritePlace}
                onChange={e => setEditFavoritePlace(e.target.value)}
                className="clay-input w-full h-10 px-3 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="clay-btn clay-btn-secondary px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="clay-btn clay-btn-primary px-5 py-2 text-xs font-medium"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
