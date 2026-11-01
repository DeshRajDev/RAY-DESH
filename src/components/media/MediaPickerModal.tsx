'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Check,
  Upload,
  Image as ImageIcon,
  Film,
  Sparkles,
  Loader2,
  Filter,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { MediaAsset } from '@/types';
import { mediaService } from '@/services/media.service';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedAssets: MediaAsset[]) => void;
  multiple?: boolean;
  title?: string;
  description?: string;
  allowedMediaType?: 'all' | 'image' | 'video';
  defaultCategory?: string;
}

const CATEGORY_TAGS = [
  { label: 'All', value: 'all' },
  { label: 'Memories', value: 'memories' },
  { label: 'Reels', value: 'reels' },
  { label: 'Feed', value: 'feed' },
  { label: 'Stories', value: 'stories' },
  { label: 'Gallery', value: 'gallery' },
  { label: 'Trips', value: 'trips' },
  { label: 'Birthday', value: 'birthday' },
  { label: 'Favorites', value: 'favorites' },
];

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  title = 'Choose from Our Media Library',
  description = 'Select photos or videos from our centralized sanctuary library',
  allowedMediaType = 'all',
  defaultCategory = 'all',
}: MediaPickerModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>(allowedMediaType);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);

  // Direct upload inside picker state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    mediaService
      .getMedia({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        mediaType: mediaTypeFilter !== 'all' ? mediaTypeFilter : undefined,
        search: searchQuery.trim() || undefined,
        limit: 100,
      })
      .then((res) => {
        if (res.success && res.data) {
          setAssets(res.data.items);
        }
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, selectedCategory, mediaTypeFilter, searchQuery]);

  const toggleSelect = (asset: MediaAsset) => {
    if (!multiple) {
      setSelectedIds(new Set([asset.id]));
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(asset.id)) {
        next.delete(asset.id);
      } else {
        next.add(asset.id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = assets.filter((a) => selectedIds.has(a.id));
    onSelect(selected);
    onClose();
    setSelectedIds(new Set());
  };

  // Direct In-Picker File Upload
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadPercent(0);

    const file = files[0];
    const categoryToAssign = selectedCategory !== 'all' ? [selectedCategory] : ['uncategorized'];

    try {
      const uploadObj = mediaService.uploadFile(
        file,
        {
          title: file.name.replace(/\.[^/.]+$/, ''),
          categories: categoryToAssign,
        },
        (pct) => setUploadPercent(pct)
      );

      const res = await uploadObj.promise;
      if (res.success && res.data) {
        const newlyUploaded = res.data;
        setAssets((prev) => [newlyUploaded, ...prev]);
        setSelectedIds((prev) => (multiple ? new Set([...prev, newlyUploaded.id]) : new Set([newlyUploaded.id])));
      }
    } catch (err) {
      console.error('Failed to upload file inside picker:', err);
    } finally {
      setIsUploading(false);
      setUploadPercent(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 bg-[#0C0C0C] text-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white" />
              <h3 className="font-serif text-lg text-white font-medium">{title}</h3>
            </div>
            <p className="text-xs text-[#888888] font-light mt-0.5">{description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{uploadPercent}%</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Upload New</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedMediaType === 'video' ? 'video/*' : allowedMediaType === 'image' ? 'image/*' : 'image/*,video/*'}
              className="hidden"
              onChange={handleDirectUpload}
            />

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#888888] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 space-y-3 border-b border-white/5 bg-[#101010] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666666]" />
              <input
                type="text"
                placeholder="Search by title, tag, or filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181818] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-white/30"
              />
            </div>

            {allowedMediaType === 'all' && (
              <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setMediaTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    mediaTypeFilter === 'all' ? 'bg-white text-black font-medium' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setMediaTypeFilter('image')}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                    mediaTypeFilter === 'image' ? 'bg-white text-black font-medium' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <ImageIcon className="h-3 w-3" />
                  <span>Photos</span>
                </button>
                <button
                  onClick={() => setMediaTypeFilter('video')}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                    mediaTypeFilter === 'video' ? 'bg-white text-black font-medium' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <Film className="h-3 w-3" />
                  <span>Videos</span>
                </button>
              </div>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TAGS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-white text-black font-medium shadow-sm'
                    : 'bg-[#161616] border border-white/5 text-[#888888] hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#888888] space-y-3">
              <Loader2 className="h-7 w-7 animate-spin text-white" />
              <p className="text-xs font-mono">Loading library moments...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#888888]">
                <ImageIcon className="h-6 w-6" />
              </div>
              <p className="text-sm text-white font-serif">No media matches this filter</p>
              <p className="text-xs text-[#777777] max-w-xs">
                Upload new photos or videos directly to add them to your sanctuary library.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="clay-btn clay-btn-primary px-4 py-2 text-xs font-medium flex items-center gap-2 mt-2"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload From Phone / Desktop</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {assets.map((asset) => {
                const isSelected = selectedIds.has(asset.id);
                const isVideo = asset.mediaType === 'video';

                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleSelect(asset)}
                    className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border transition-all ${
                      isSelected
                        ? 'border-white ring-2 ring-white/50 scale-[0.98]'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    {isVideo ? (
                      <div className="relative w-full h-full bg-black">
                        {asset.thumbnailUrl ? (
                          <img
                            src={asset.thumbnailUrl}
                            alt={asset.title || 'Video'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video src={asset.url} className="w-full h-full object-cover" preload="metadata" />
                        )}
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-white">
                          <Film className="h-3 w-3" />
                          {asset.duration ? <span>{asset.duration}s</span> : null}
                        </div>
                      </div>
                    ) : (
                      <img
                        src={asset.thumbnailUrl || asset.url}
                        alt={asset.title || 'Photo'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}

                    {/* Selection Checkmark Badge */}
                    <div
                      className={`absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                        isSelected
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-black/50 border-white/20 text-transparent group-hover:border-white/60'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>

                    {/* Title & Caption Bottom Bar */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-left pointer-events-none">
                      <p className="text-[11px] font-serif text-white truncate">{asset.title || asset.originalFilename}</p>
                      {asset.categories && asset.categories.length > 0 && (
                        <p className="text-[9px] font-mono text-[#AAAAAA] uppercase tracking-wider truncate">
                          {asset.categories.join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/10 bg-[#101010] shrink-0">
          <div className="text-xs text-[#888888] font-mono">
            {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-[#AAAAAA] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className={`clay-btn clay-btn-primary px-5 py-2 text-xs font-medium flex items-center gap-1.5 transition-all ${
                selectedIds.size === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Use Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
