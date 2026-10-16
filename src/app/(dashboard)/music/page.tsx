'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Music, Play, Pause, Heart, Disc, Volume2, Sparkles, Clock, User, ArrowRight } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Song } from '@/types';
import { musicService } from '@/services/music.service';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/date-utils';

const MUSIC_SECTIONS = [
  'All',
  'Our Songs',
  'Her Favorites',
  'My Favorites',
  'Recently Added',
  'Most Played',
] as const;

export default function MusicPage() {
  const { user, partner, currentSong, isPlaying, playSong, togglePlay, triggerHeartEffect } = useApp();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Song state
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newCategory, setNewCategory] = useState<Song['category']>('Our Songs');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newLyrics, setNewLyrics] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    musicService.getSongs(selectedSection).then(res => setSongs(res.data));
    const unsubscribe = musicService.subscribe(updated => {
      if (selectedSection === 'All') setSongs(updated);
      else setSongs(updated.filter(s => s.category === selectedSection));
    });
    return () => unsubscribe();
  }, [selectedSection]);

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim()) return;

    await musicService.addSong({
      title: newTitle.trim(),
      artist: newArtist.trim(),
      duration: 210,
      coverUrl: newCoverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      addedById: user.id,
      addedByName: user.name,
      isFavorite: false,
      category: newCategory,
      lyricsSnippet: newLyrics.trim() || undefined,
      note: newNote.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewArtist('');
    setNewCoverUrl('');
    setNewLyrics('');
    setNewNote('');
  };

  const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await musicService.toggleFavorite(id);
    triggerHeartEffect();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
            <Music className="h-3.5 w-3.5 text-white" />
            <span>Shared Audio Sanctuary</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Music Collection</h1>
          <p className="text-xs sm:text-sm text-[#777777] font-light">
            The soundtrack of our late drives, cooking nights, and sweet moments
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Track
        </button>
      </div>

      {/* Hero Featured Now Playing Card */}
      {currentSong && (
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#181818] to-[#0A0A0A] p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6 overflow-hidden">
          <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-3xl border border-white/15 shadow-2xl group">
            <img
              src={currentSong.coverUrl}
              alt={currentSong.title}
              className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
            />
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-black" />
              ) : (
                <Play className="h-5 w-5 fill-black ml-0.5" />
              )}
            </button>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="rounded-full bg-white/10 px-3 py-0.5 text-[10px] font-mono text-white">
                {currentSong.category}
              </span>
              <span className="text-xs font-mono text-[#777777]">
                Added by {currentSong.addedByName}
              </span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal">
              {currentSong.title}
            </h2>
            <p className="text-sm text-[#AAAAAA] font-light">{currentSong.artist}</p>

            {currentSong.note && (
              <p className="text-xs text-[#888888] font-light italic max-w-lg pt-1">
                &ldquo;{currentSong.note}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        {MUSIC_SECTIONS.map(sec => (
          <button
            key={sec}
            onClick={() => setSelectedSection(sec)}
            className={`clay-pill ${selectedSection === sec ? 'active' : 'text-[#888888] hover:text-white'}`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Songs Table List */}
      <div className="rounded-3xl border border-white/10 bg-[#0C0C0C] p-4 sm:p-6 shadow-md">
        <div className="space-y-1">
          {songs.map((song, index) => {
            const isThisPlaying = currentSong?.id === song.id && isPlaying;

            return (
              <div
                key={song.id}
                onClick={() => playSong(song)}
                className={`group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${
                  currentSong?.id === song.id
                    ? 'bg-white/10 border border-white/20'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xs font-mono text-[#555555] w-5 text-right shrink-0">
                    {index + 1}
                  </span>

                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h4 className={`font-serif text-sm font-normal line-clamp-1 ${
                      currentSong?.id === song.id ? 'text-white font-medium' : 'text-[#E5E5E5]'
                    }`}>
                      {song.title}
                    </h4>
                    <p className="text-xs text-[#777777] font-light line-clamp-1">{song.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="hidden sm:inline text-xs font-mono text-[#666666]">
                    {song.category}
                  </span>

                  <button
                    onClick={(e) => handleToggleFavorite(e, song.id)}
                    className="p-1.5 rounded-full text-[#777777] hover:text-white"
                  >
                    <Heart className={`h-4 w-4 ${song.isFavorite ? 'fill-white text-white' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD SONG MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add a Song to Our Sanctuary"
        description="Share a melody that reminds you of us."
      >
        <form onSubmit={handleAddSong} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Song Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Mystery of Love"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Artist Name</label>
            <input
              type="text"
              required
              value={newArtist}
              onChange={e => setNewArtist(e.target.value)}
              placeholder="e.g. Sufjan Stevens"
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Playlist Category</label>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as Song['category'])}
              className="clay-input w-full h-10 px-3 text-xs bg-[#0D0D0D]"
            >
              <option value="Our Songs">Our Songs</option>
              <option value="Her Favorites">Her Favorites</option>
              <option value="My Favorites">My Favorites</option>
              <option value="Recently Added">Recently Added</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Album Cover URL</label>
            <input
              type="text"
              value={newCoverUrl}
              onChange={e => setNewCoverUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="clay-input w-full h-10 px-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#AAAAAA]">Personal Note / Story</label>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Why this song means something to us..."
              rows={2}
              className="clay-input w-full p-3 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="clay-btn clay-btn-secondary px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="clay-btn clay-btn-primary px-5 py-2 text-xs font-medium"
            >
              Add to Playlist
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
