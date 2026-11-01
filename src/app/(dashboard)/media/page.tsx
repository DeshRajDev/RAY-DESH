'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Images,
  Upload,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Heart,
  Trash2,
  Edit3,
  ExternalLink,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Camera,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  Loader2,
  ChevronDown,
  Tag,
  Check,
  FolderHeart,
  Share2
} from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { MediaAsset, MediaSectionCategory } from '@/types';
import { mediaService } from '@/services/media.service';
import { Modal } from '@/components/ui/modal';

const ALL_CATEGORIES: { label: string; value: string; icon?: string }[] = [
  { label: 'All Media', value: 'all' },
  { label: 'Photos', value: 'photos_only' },
  { label: 'Videos', value: 'videos_only' },
  { label: 'Our Reels', value: 'reels' },
  { label: 'Memories', value: 'memories' },
  { label: 'Our Feed', value: 'feed' },
  { label: 'Stories', value: 'stories' },
  { label: 'Our Gallery', value: 'gallery' },
  { label: 'Trips & Travel', value: 'trips' },
  { label: 'Birthday', value: 'birthday' },
  { label: 'Romantic Moments', value: 'romantic' },
  { label: 'Spiritual Places', value: 'spiritual' },
  { label: 'Future Dreams', value: 'dreams' },
  { label: 'Favorites', value: 'favorites' },
  { label: 'Uncategorized', value: 'uncategorized' },
];

const SECTION_ASSIGN_OPTIONS = [
  { label: 'Reels', value: 'reels' },
  { label: 'Memories', value: 'memories' },
  { label: 'Our Feed', value: 'feed' },
  { label: 'Stories', value: 'stories' },
  { label: 'Our Gallery', value: 'gallery' },
  { label: 'Trips & Travel', value: 'trips' },
  { label: 'Birthday', value: 'birthday' },
  { label: 'Romantic Moments', value: 'romantic' },
  { label: 'Spiritual Places', value: 'spiritual' },
  { label: 'Future Dreams', value: 'dreams' },
];

interface BatchUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  isVideo: boolean;
  title: string;
  caption: string;
  categories: string[];
  tags: string[];
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function MediaLibraryPage() {
  const { user, triggerHeartEffect } = useApp();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Multi-select actions state
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadBatch, setUploadBatch] = useState<BatchUploadItem[]>([]);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Common batch categorization
  const [bulkSelectedCategories, setBulkSelectedCategories] = useState<string[]>(['uncategorized']);
  const [bulkCustomTagInput, setBulkCustomTagInput] = useState('');
  const [bulkCustomTags, setBulkCustomTags] = useState<string[]>([]);

  // Item preview / Edit modal
  const [activePreviewAsset, setActivePreviewAsset] = useState<MediaAsset | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<MediaAsset | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editCustomTag, setEditCustomTag] = useState('');

  // Native input refs for direct mobile gallery / camera selection
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Video preview player controls
  const [previewVideoPlaying, setPreviewVideoPlaying] = useState(true);
  const [previewVideoMuted, setPreviewVideoMuted] = useState(false);

  // Load Media Assets
  const loadMedia = useCallback(async () => {
    setIsLoading(true);

    let mediaTypeFilter: 'all' | 'image' | 'video' = 'all';
    let catFilter = selectedCategory;

    if (selectedCategory === 'photos_only') {
      mediaTypeFilter = 'image';
      catFilter = 'all';
    } else if (selectedCategory === 'videos_only') {
      mediaTypeFilter = 'video';
      catFilter = 'all';
    }

    const res = await mediaService.getMedia({
      category: catFilter !== 'all' ? catFilter : undefined,
      mediaType: mediaTypeFilter !== 'all' ? mediaTypeFilter : undefined,
      favorite: selectedCategory === 'favorites' ? true : undefined,
      search: searchQuery.trim() || undefined,
      limit: 150,
    });

    if (res.success && res.data) {
      setAssets(res.data.items);
    }
    setIsLoading(false);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadMedia();
    const unsub = mediaService.subscribe((updated) => {
      setAssets(updated);
    });
    return () => unsub();
  }, [loadMedia]);

  // Handle Drag & Drop on Desktop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  // Convert selected File objects into BatchUploadItem records
  const handleFilesSelected = (files: File[]) => {
    const defaultCats = selectedCategory !== 'all' && selectedCategory !== 'photos_only' && selectedCategory !== 'videos_only'
      ? [selectedCategory]
      : bulkSelectedCategories;

    const newItems: BatchUploadItem[] = files.map((file, idx) => {
      const isVideo = file.type.startsWith('video');
      const previewUrl = URL.createObjectURL(file);
      const title = file.name.replace(/\.[^/.]+$/, '');

      return {
        id: `upload_${Date.now()}_${idx}_${Math.random()}`,
        file,
        previewUrl,
        isVideo,
        title,
        caption: '',
        categories: [...defaultCats],
        tags: [...bulkCustomTags],
        progress: 0,
        status: 'pending',
      };
    });

    setUploadBatch((prev) => [...prev, ...newItems]);
    setIsUploadModalOpen(true);
  };

  // Bulk category toggle in upload modal
  const toggleBulkCategory = (cat: string) => {
    setBulkSelectedCategories((prev) => {
      let updated: string[];
      if (prev.includes(cat)) {
        updated = prev.filter((c) => c !== cat);
        if (updated.length === 0) updated = ['uncategorized'];
      } else {
        updated = [...prev.filter((c) => c !== 'uncategorized'), cat];
      }

      // Propagate to pending batch items
      setUploadBatch((items) =>
        items.map((item) => (item.status === 'pending' ? { ...item, categories: updated } : item))
      );
      return updated;
    });
  };

  const handleAddBulkCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && bulkCustomTagInput.trim()) {
      e.preventDefault();
      const tag = bulkCustomTagInput.trim().toLowerCase();
      if (!bulkCustomTags.includes(tag)) {
        const nextTags = [...bulkCustomTags, tag];
        setBulkCustomTags(nextTags);
        setUploadBatch((items) =>
          items.map((item) => (item.status === 'pending' ? { ...item, tags: nextTags } : item))
        );
      }
      setBulkCustomTagInput('');
    }
  };

  // Execute Batch Upload
  const handleExecuteBatchUpload = async () => {
    if (uploadBatch.length === 0 || isBatchUploading) return;

    setIsBatchUploading(true);
    setOverallProgress(0);

    const pendingItems = uploadBatch.filter((item) => item.status === 'pending');
    let completedCount = 0;

    // Process files sequentially or in small parallel batches to support 20+ mobile videos reliably
    for (let i = 0; i < uploadBatch.length; i++) {
      const item = uploadBatch[i];
      if (item.status === 'completed') continue;

      setUploadBatch((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'uploading', progress: 10 } : it))
      );

      try {
        const uploadObj = mediaService.uploadFile(
          item.file,
          {
            title: item.title,
            caption: item.caption,
            categories: item.categories.length > 0 ? item.categories : bulkSelectedCategories,
            tags: item.tags.length > 0 ? item.tags : bulkCustomTags,
          },
          (percent) => {
            setUploadBatch((prev) =>
              prev.map((it, idx) => (idx === i ? { ...it, progress: percent } : it))
            );
          }
        );

        const res = await uploadObj.promise;
        if (res.success && res.data) {
          completedCount++;
          setUploadBatch((prev) =>
            prev.map((it, idx) => (idx === i ? { ...it, status: 'completed', progress: 100 } : it))
          );
        } else {
          setUploadBatch((prev) =>
            prev.map((it, idx) => (idx === i ? { ...it, status: 'error', error: 'Upload failed' } : it))
          );
        }
      } catch (err: any) {
        setUploadBatch((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: 'error', error: err?.message || 'Network error' } : it
          )
        );
      }

      setOverallProgress(Math.round(((i + 1) / uploadBatch.length) * 100));
    }

    setIsBatchUploading(false);
    triggerHeartEffect();
    loadMedia();
  };

  // Toggle Favorite
  const handleToggleFavorite = async (e: React.MouseEvent, asset: MediaAsset) => {
    e.stopPropagation();
    const newFav = await mediaService.toggleFavorite(asset.id);
    triggerHeartEffect(e.clientX, e.clientY);
  };

  // Open Edit Modal
  const handleOpenEditModal = (asset: MediaAsset) => {
    setAssetToEdit(asset);
    setEditTitle(asset.title || '');
    setEditCaption(asset.caption || '');
    setEditCategories([...(asset.categories || [])]);
    setEditTags([...(asset.tags || [])]);
    setIsEditModalOpen(true);
  };

  // Save Edit Details
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetToEdit) return;

    await mediaService.updateMedia(assetToEdit.id, {
      title: editTitle.trim(),
      caption: editCaption.trim(),
      categories: editCategories.length > 0 ? editCategories : ['uncategorized'],
      tags: editTags,
    });

    setIsEditModalOpen(false);
    setAssetToEdit(null);
    loadMedia();
  };

  // Remove from Section or Delete Entirely
  const handleDeleteAsset = async (asset: MediaAsset, removeFromSection?: string) => {
    const confirmMsg = removeFromSection
      ? `Remove this media from "${removeFromSection}" section? (The original photo/video will remain safe in Our Media Library)`
      : `Are you sure you want to permanently delete "${asset.title || 'this file'}"?`;

    if (!window.confirm(confirmMsg)) return;

    await mediaService.deleteMedia(asset.id, removeFromSection);
    if (activePreviewAsset?.id === asset.id) setActivePreviewAsset(null);
    loadMedia();
  };

  // Multi-Select Helpers
  const toggleSelectAsset = (id: string) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedAssetIds.size === 0) return;
    if (!window.confirm(`Permanently delete ${selectedAssetIds.size} selected items?`)) return;

    await mediaService.bulkDelete(Array.from(selectedAssetIds));
    setSelectedAssetIds(new Set());
    setIsMultiSelectMode(false);
    loadMedia();
  };

  const handleBulkAssignCategory = async (cat: string) => {
    if (selectedAssetIds.size === 0) return;
    await mediaService.bulkUpdate(Array.from(selectedAssetIds), { addCategories: [cat] });
    setSelectedAssetIds(new Set());
    setIsMultiSelectMode(false);
    loadMedia();
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className="mx-auto max-w-7xl px-3 sm:px-6 md:px-8 py-5 space-y-6 select-none"
    >
      {/* Hidden Native File Pickers for Mobile & Desktop */}
      <input
        ref={galleryInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFilesSelected(Array.from(e.target.files))}
      />
      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept="video/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFilesSelected(Array.from(e.target.files))}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && handleFilesSelected(Array.from(e.target.files))}
      />

      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#777777] mb-1">
            <Images className="h-3.5 w-3.5 text-white" />
            <span>Centralized Media Management</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Media Library</h1>
          <p className="text-xs sm:text-sm text-[#888888] font-light mt-0.5">
            Every photo, every little moment, all in one place.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile Camera Quick Tap */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="md:hidden p-2.5 rounded-2xl bg-[#141414] border border-white/10 text-white hover:bg-white/10 transition-colors"
            title="Snap with camera"
          >
            <Camera className="h-4 w-4" />
          </button>

          {/* Bulk Reels Upload Direct Trigger */}
          <button
            onClick={() => {
              setBulkSelectedCategories(['reels']);
              videoInputRef.current?.click();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#181818] border border-white/15 text-xs text-white hover:bg-white/10 hover:border-white/30 transition-all"
            title="Select 20+ reels directly from phone"
          >
            <Film className="h-4 w-4 text-white" />
            <span>Upload Reels</span>
          </button>

          {/* Primary Upload Media Button */}
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-medium flex items-center gap-2 shadow-[0_4px_16px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all"
          >
            <Upload className="h-4 w-4" />
            <span>Add Photos / Videos</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Visual Overlay on Desktop */}
      {dragActive && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-white/40 pointer-events-none">
          <Upload className="h-14 w-14 text-white animate-bounce mb-3" />
          <h3 className="font-serif text-2xl text-white">Drop photos and videos anywhere</h3>
          <p className="text-xs text-[#888888]">They will be uploaded directly to Our Media Library</p>
        </div>
      )}

      {/* 2. Search, Filter Chips & View Mode Bar */}
      <div className="flex flex-col gap-3 p-4 rounded-3xl border border-white/10 bg-[#0F0F0F]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666666]" />
            <input
              type="text"
              placeholder="Search by title, caption, tag, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161616] border border-white/10 rounded-2xl pl-10 pr-3 py-2 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Multi-Select Toggle & View Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                if (isMultiSelectMode) setSelectedAssetIds(new Set());
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                isMultiSelectMode
                  ? 'bg-white text-black font-medium border-white'
                  : 'bg-[#161616] border-white/10 text-[#888888] hover:text-white'
              }`}
            >
              {isMultiSelectMode ? `Selecting (${selectedAssetIds.size})` : 'Multi-Select'}
            </button>

            <div className="flex items-center bg-[#161616] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-black' : 'text-[#777777] hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white text-black' : 'text-[#777777] hover:text-white'
                }`}
                title="List View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Horizontal Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-white/5">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? 'bg-white text-black font-medium shadow-md'
                  : 'bg-[#161616] border border-white/5 text-[#888888] hover:text-white hover:border-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Multi-Select Floating Action Bar */}
      <AnimatePresence>
        {isMultiSelectMode && selectedAssetIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#161616]/95 border border-white/20 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-xs"
          >
            <span className="font-mono text-white">{selectedAssetIds.size} selected</span>

            {/* Quick Add to Section Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#888888] hidden sm:inline">Add to:</span>
              <button
                onClick={() => handleBulkAssignCategory('reels')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono"
              >
                + Reels
              </button>
              <button
                onClick={() => handleBulkAssignCategory('memories')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono"
              >
                + Memories
              </button>
              <button
                onClick={() => handleBulkAssignCategory('feed')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono"
              >
                + Feed
              </button>
            </div>

            <div className="h-4 w-px bg-white/20" />

            <button
              onClick={handleBulkDelete}
              className="text-red-400 hover:text-red-300 font-mono flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Media Grid / List Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 text-[#888888]">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-xs font-mono">Loading Our Media Library...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0F0F0F] p-8 sm:p-14 text-center max-w-lg mx-auto space-y-4 shadow-xl">
          <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white">
            <Images className="h-7 w-7 text-white" />
          </div>
          <h3 className="font-serif text-xl text-white">Your Sanctuary Library is Empty</h3>
          <p className="text-xs sm:text-sm text-[#888888] leading-relaxed">
            Upload your photos, videos, and reels directly from your mobile gallery or desktop. Organize them once, and enjoy them across Memories, Reels, Stories, and Travel.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-medium flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              <span>Select Photos from Phone</span>
            </button>
            <button
              onClick={() => {
                setBulkSelectedCategories(['reels']);
                videoInputRef.current?.click();
              }}
              className="px-4 py-2.5 rounded-2xl bg-[#1A1A1A] border border-white/10 text-xs text-white hover:bg-white/10 flex items-center gap-2"
            >
              <Film className="h-4 w-4" />
              <span>Select 20+ Reels</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {assets.map((asset) => {
            const isVideo = asset.mediaType === 'video';
            const isSelected = selectedAssetIds.has(asset.id);

            return (
              <div
                key={asset.id}
                onClick={() => {
                  if (isMultiSelectMode) {
                    toggleSelectAsset(asset.id);
                  } else {
                    setActivePreviewAsset(asset);
                  }
                }}
                className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border bg-[#0C0C0C] transition-all duration-300 ${
                  isSelected
                    ? 'border-white ring-2 ring-white/60 scale-[0.98]'
                    : 'border-white/10 hover:border-white/40 hover:shadow-2xl'
                }`}
              >
                {/* Media Presentation */}
                {isVideo ? (
                  <div className="relative w-full h-full bg-black">
                    <img
                      src={asset.thumbnailUrl || asset.url}
                      alt={asset.title || 'Video'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-mono text-white border border-white/10">
                      <Film className="h-3 w-3" />
                      {asset.duration ? <span>{asset.duration}s</span> : null}
                    </div>
                  </div>
                ) : (
                  <img
                    src={asset.thumbnailUrl || asset.url}
                    alt={asset.title || 'Photo'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {/* Top Action Overlay (Favorite + Multi-Select Checkbox) */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-2 z-10">
                  {isMultiSelectMode ? (
                    <div
                      className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-white text-black border-white' : 'bg-black/50 border-white/30 text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleToggleFavorite(e, asset)}
                      className="p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:scale-110 transition-transform"
                      title={asset.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${asset.isFavorite ? 'fill-red-500 text-red-500' : 'text-[#AAAAAA]'}`}
                      />
                    </button>
                  )}
                </div>

                {/* Bottom Title & Categories Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-3 pt-6 text-left">
                  <h4 className="font-serif text-xs text-white truncate font-medium">
                    {asset.title || asset.originalFilename}
                  </h4>
                  {asset.caption && (
                    <p className="text-[10px] text-[#AAAAAA] truncate font-light mt-0.5">{asset.caption}</p>
                  )}
                  {asset.categories && asset.categories.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 overflow-hidden">
                      {asset.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#CCCCCC] uppercase tracking-wider shrink-0"
                        >
                          {cat}
                        </span>
                      ))}
                      {asset.categories.length > 2 && (
                        <span className="text-[9px] font-mono text-[#888888]">+{asset.categories.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2 rounded-3xl border border-white/10 bg-[#0F0F0F] p-3 divide-y divide-white/5">
          {assets.map((asset) => {
            const isVideo = asset.mediaType === 'video';
            const isSelected = selectedAssetIds.has(asset.id);

            return (
              <div
                key={asset.id}
                onClick={() => (isMultiSelectMode ? toggleSelectAsset(asset.id) : setActivePreviewAsset(asset))}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                  isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {isMultiSelectMode && (
                    <div
                      className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white text-black border-white' : 'bg-black/50 border-white/30 text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                    <img
                      src={asset.thumbnailUrl || asset.url}
                      alt={asset.title || 'Media'}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif text-sm text-white truncate font-medium">
                        {asset.title || asset.originalFilename}
                      </h4>
                      {isVideo && (
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono text-[#AAAAAA] uppercase">
                          Video
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#777777] font-light truncate">
                      {asset.caption || asset.originalFilename} • {(asset.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:flex items-center gap-1">
                    {asset.categories?.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[#AAAAAA]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => handleToggleFavorite(e, asset)}
                    className="p-2 rounded-full hover:bg-white/10 text-white"
                  >
                    <Heart
                      className={`h-4 w-4 ${asset.isFavorite ? 'fill-red-500 text-red-500' : 'text-[#777777]'}`}
                    />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(asset);
                    }}
                    className="p-2 rounded-full hover:bg-white/10 text-[#888888] hover:text-white"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          BATCH UPLOAD MODAL (Bulk 20+ Reels & Photos from Mobile/Desktop)
          ========================================================================= */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          if (!isBatchUploading) {
            setIsUploadModalOpen(false);
            setUploadBatch([]);
          }
        }}
        title={`Upload to Our Media Library (${uploadBatch.length} files)`}
        description="Assign categories and tags so your media appears automatically in Reels, Memories, Feed, and Travel."
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Bulk Category Assigner */}
          <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                <span>Assign Sections for this Batch:</span>
              </span>
              <span className="text-[10px] font-mono text-[#888888]">Tap to toggle</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SECTION_ASSIGN_OPTIONS.map((opt) => {
                const isAssigned = bulkSelectedCategories.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleBulkCategory(opt.value)}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                      isAssigned
                        ? 'bg-white text-black font-medium shadow-sm'
                        : 'bg-[#1C1C1C] text-[#888888] hover:text-white border border-white/5'
                    }`}
                  >
                    {isAssigned ? `✓ ${opt.label}` : opt.label}
                  </button>
                );
              })}
            </div>

            {/* Bulk Custom Tags */}
            <div className="pt-2 border-t border-white/5 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add custom tag (press Enter)..."
                value={bulkCustomTagInput}
                onChange={(e) => setBulkCustomTagInput(e.target.value)}
                onKeyDown={handleAddBulkCustomTag}
                className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#666666] focus:outline-none"
              />
              <div className="flex items-center gap-1 flex-wrap">
                {bulkCustomTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-md text-white flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setBulkCustomTags((t) => t.filter((x) => x !== tag))}
                      className="hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Individual Batch Items Preview List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#888888] px-1">
              <span>Selected Files ({uploadBatch.length})</span>
              {isBatchUploading && <span>Overall Progress: {overallProgress}%</span>}
            </div>

            {isBatchUploading && (
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-200"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {uploadBatch.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#141414] border border-white/5 gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                      {item.isVideo ? (
                        <video src={item.previewUrl} className="h-full w-full object-cover" />
                      ) : (
                        <img src={item.previewUrl} alt={item.title} className="h-full w-full object-cover" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={item.title}
                        disabled={isBatchUploading}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUploadBatch((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, title: val } : it))
                          );
                        }}
                        className="bg-transparent border-0 text-xs font-serif text-white truncate focus:outline-none w-full"
                      />
                      <span className="text-[10px] font-mono text-[#777777] block">
                        {(item.file.size / (1024 * 1024)).toFixed(1)} MB • {item.isVideo ? 'Video' : 'Photo'}
                      </span>
                    </div>
                  </div>

                  {/* Status / Progress */}
                  <div className="shrink-0 flex items-center gap-2">
                    {item.status === 'uploading' && (
                      <span className="text-xs font-mono text-white flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {item.progress}%
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Done
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-xs font-mono text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Failed
                      </span>
                    )}
                    {!isBatchUploading && item.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => setUploadBatch((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 rounded-lg text-[#666666] hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Upload Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              disabled={isBatchUploading}
              onClick={() => galleryInputRef.current?.click()}
              className="text-xs font-mono text-[#AAAAAA] hover:text-white flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add More Files</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isBatchUploading}
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadBatch([]);
                }}
                className="px-4 py-2 rounded-xl text-xs text-[#888888] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBatchUploading || uploadBatch.length === 0}
                onClick={handleExecuteBatchUpload}
                className="clay-btn clay-btn-primary px-5 py-2 text-xs font-medium flex items-center gap-2"
              >
                {isBatchUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload All ({uploadBatch.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
          FULLSCREEN MEDIA VIEWER / LIGHTBOX
          ========================================================================= */}
      <AnimatePresence>
        {activePreviewAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActivePreviewAsset(null)}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <div>
                  <h3 className="font-serif text-base text-white font-medium">
                    {activePreviewAsset.title || activePreviewAsset.originalFilename}
                  </h3>
                  <p className="text-[11px] font-mono text-[#888888]">
                    {activePreviewAsset.categories?.join(' • ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleToggleFavorite(e, activePreviewAsset)}
                  className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      activePreviewAsset.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleOpenEditModal(activePreviewAsset)}
                  className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20"
                  title="Edit Details & Tags"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteAsset(activePreviewAsset)}
                  className="p-2.5 rounded-full bg-white/10 text-red-400 hover:bg-red-500/20"
                  title="Delete Media"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Center Player / Image Stage */}
            <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
              {activePreviewAsset.mediaType === 'video' ? (
                <div className="relative max-h-full max-w-full aspect-[9/16] sm:aspect-auto rounded-2xl overflow-hidden bg-black shadow-2xl flex items-center justify-center">
                  <video
                    src={activePreviewAsset.url}
                    autoPlay
                    controls
                    loop
                    playsInline
                    className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain"
                  />
                </div>
              ) : (
                <img
                  src={activePreviewAsset.url}
                  alt={activePreviewAsset.title}
                  className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
                />
              )}
            </div>

            {/* Bottom Caption & Section Badges */}
            <div className="z-10 max-w-2xl mx-auto w-full text-center space-y-2 pb-2">
              {activePreviewAsset.caption && (
                <p className="text-xs sm:text-sm text-[#CCCCCC] font-serif font-light leading-relaxed">
                  &ldquo;{activePreviewAsset.caption}&rdquo;
                </p>
              )}
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {activePreviewAsset.categories?.map((cat) => (
                  <span
                    key={cat}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/10"
                  >
                    Mapped to: {cat}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          EDIT DETAILS & SECTIONS MODAL
          ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Media Details"
        description="Organize which sections of Ray this photo or video appears in."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#AAAAAA]">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="clay-input w-full h-10 px-3 text-xs"
              placeholder="e.g. Beautiful Sunset in Manali"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#AAAAAA]">Caption / Note</label>
            <textarea
              rows={2}
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="clay-input w-full p-2.5 text-xs resize-none"
              placeholder="A sweet memory or personal thought..."
            />
          </div>

          {/* Section Categories */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-[#AAAAAA]">Active Sections</label>
            <div className="flex flex-wrap gap-1.5">
              {SECTION_ASSIGN_OPTIONS.map((opt) => {
                const active = editCategories.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setEditCategories((prev) =>
                        prev.includes(opt.value) ? prev.filter((c) => c !== opt.value) : [...prev, opt.value]
                      );
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                      active
                        ? 'bg-white text-black font-medium shadow-sm'
                        : 'bg-[#181818] text-[#888888] border border-white/5 hover:text-white'
                    }`}
                  >
                    {active ? `✓ ${opt.label}` : opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Tags */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-[#AAAAAA]">Custom Tags</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editCustomTag}
                onChange={(e) => setEditCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editCustomTag.trim()) {
                    e.preventDefault();
                    const tag = editCustomTag.trim().toLowerCase();
                    if (!editTags.includes(tag)) setEditTags((t) => [...t, tag]);
                    setEditCustomTag('');
                  }
                }}
                className="clay-input flex-1 h-9 px-3 text-xs"
                placeholder="Type tag and press enter..."
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {editTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white flex items-center gap-1"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setEditTags((t) => t.filter((x) => x !== tag))}
                    className="hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-[#888888] hover:text-white"
            >
              Cancel
            </button>
            <button type="submit" className="clay-btn clay-btn-primary px-5 py-2 text-xs font-medium">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
