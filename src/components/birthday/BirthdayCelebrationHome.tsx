'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Cake,
  Gift,
  Sparkles,
  MapPin,
  Bookmark,
  Check,
  Play,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Compass,
  Star,
  Quote,
  Smile,
  Flower2,
  Plus,
  X,
  Upload,
  Calendar,
  Eye,
  Lock,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '@/stores/app-context';
import { bucketListService } from '@/services/bucketList.service';
import { memoryService } from '@/services/memory.service';
import { birthdayService } from '@/services/birthday.service';
import { mediaService } from '@/services/media.service';
import { BirthdayData, Memory, MediaAsset } from '@/types';
import { Modal } from '@/components/ui/modal';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';

// Curated Real India Travel Dreams
interface TravelDream {
  id: string;
  name: string;
  location: string;
  category: 'Spiritual' | 'Snow' | 'Nature' | 'Romantic';
  image: string;
  description: string;
  whySpecial: string;
}

const DREAM_DESTINATIONS: TravelDream[] = [
  {
    id: 'vrindavan',
    name: 'Prem Mandir & Banke Bihari',
    location: 'Vrindavan, Uttar Pradesh',
    category: 'Spiritual',
    image: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&auto=format&fit=crop&q=80',
    description: 'The sacred land of divine love, evening aarti, and spiritual serenity.',
    whySpecial: 'Praying together hand in hand for our lifelong happiness and eternal bond.',
  },
  {
    id: 'varanasi',
    name: 'Ganga Ghats & Evening Aarti',
    location: 'Varanasi, Uttar Pradesh',
    category: 'Spiritual',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80',
    description: 'Golden river lanterns floating across the calm water as the sacred bells ring.',
    whySpecial: 'Sitting by the quiet waters under starlight, listening to ancient peace together.',
  },
  {
    id: 'kedarnath',
    name: 'Kedarnath Temple',
    location: 'Garhwal Himalayas, Uttarakhand',
    category: 'Spiritual',
    image: 'https://images.unsplash.com/photo-1626714485552-32a2ef1eb394?w=800&auto=format&fit=crop&q=80',
    description: 'Majestic snow-clad peaks surrounding the sacred abode of devotion.',
    whySpecial: 'Our hardest trek together culminating in the purest spiritual blessing for us.',
  },
  {
    id: 'rishikesh',
    name: 'Triveni Ghat & Laxman Jhula',
    location: 'Rishikesh, Uttarakhand',
    category: 'Spiritual',
    image: 'https://images.unsplash.com/photo-1600100397608-f010f4439c2e?w=800&auto=format&fit=crop&q=80',
    description: 'Gentle river breezes, mountain backdrop, and quiet meditative mornings.',
    whySpecial: 'Peaceful walks by the holy Ganges and drinking chai at riverside mountain cafés.',
  },
  {
    id: 'gulmarg',
    name: 'Gulmarg Snow Meadows',
    location: 'Kashmir',
    category: 'Snow',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&auto=format&fit=crop&q=80',
    description: 'Powder-soft white snow, pine forests wrapped in frost, and gondola rides.',
    whySpecial: 'Watching you smile in your warm jacket as snowflakes gently rest in your hair.',
  },
  {
    id: 'manali',
    name: 'Solang Valley & Rohtang Pass',
    location: 'Manali, Himachal Pradesh',
    category: 'Snow',
    image: 'https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=800&auto=format&fit=crop&q=80',
    description: 'High mountain passes, steaming wooden roadside tea stalls, and snow hills.',
    whySpecial: 'Our cozy mountain retreat, watching the snow fall while curled up together.',
  },
  {
    id: 'auli',
    name: 'Auli Alpine Slopes',
    location: 'Chamoli, Uttarakhand',
    category: 'Snow',
    image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80',
    description: 'Clean panoramic views of Nanda Devi peak surrounded by coniferous forests.',
    whySpecial: 'One of the quietest snowy paradises in India, made just for couple walks.',
  },
  {
    id: 'meghalaya',
    name: 'Cherrapunji & Living Root Bridges',
    location: 'East Khasi Hills, Meghalaya',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    description: 'Emerald green waterfalls, mist-covered valleys, and clean fresh air.',
    whySpecial: 'Stepping into a magical fairytale world of green moss, clouds, and clean silence.',
  },
  {
    id: 'kasol',
    name: 'Parvati Valley & Tirthan Valley',
    location: 'Kullu, Himachal Pradesh',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=800&auto=format&fit=crop&q=80',
    description: 'Rushing crystal-clear mountain streams, wooden cabins, and tall pines.',
    whySpecial: 'Holding hands across wooden footbridges, listening only to the river and each other.',
  },
  {
    id: 'munnar',
    name: 'Munnar Rolling Tea Hills',
    location: 'Idukki, Kerala',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop&q=80',
    description: 'Endless soft green hills under morning mist with the sweet fragrance of fresh tea.',
    whySpecial: 'Slow morning walks where the fog wraps the green hills in romantic quietness.',
  },
  {
    id: 'dallake',
    name: 'Dal Lake Wooden Houseboat',
    location: 'Srinagar, Kashmir',
    category: 'Romantic',
    image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=800&auto=format&fit=crop&q=80',
    description: 'Carved cedar wood shikara drifting on still waters at sunset with floating lotus.',
    whySpecial: 'Our dream sunset boat ride, wrapped in a blanket, sharing quiet whispers.',
  },
  {
    id: 'valleyofflowers',
    name: 'Valley of Flowers',
    location: 'Chamoli, Uttarakhand',
    category: 'Romantic',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop&q=80',
    description: 'Hundreds of rare alpine wildflowers carpeting a high mountain glacial valley.',
    whySpecial: 'You love flowers — walking you into a whole valley of blossoms is my dream.',
  },
];

// Meaningful Personal Message Cards
const BIRTHDAY_CARDS = [
  {
    id: 'card-1',
    title: 'To My Beautiful Ray',
    tag: 'From My Heart',
    quote: 'In all the world, there is no heart for me like yours.',
    preview: 'Happy Birthday, bchu. You are the quiet strength and the softest light in my life...',
    fullText:
      'Happy Birthday, bchu. You are the quiet strength and the softest light in my life. The way you smile, the gentle simplicity you carry, the elegance when you wear your favorite suits — every single thing about you makes my heart swell with love. We may have started as two souls talking on September 24, but every day since September 27 has proven that you are my forever.',
  },
  {
    id: 'card-2',
    title: 'Our Long Journey',
    tag: 'Patience & Love',
    quote: 'Distance means so little when someone means so much.',
    preview: 'We have been together for years through every conversation, dream, and late-night whisper...',
    fullText:
      'We have been together for years through every conversation, dream, and late-night whisper. We have not met in person yet, but our bond has grown deeper and more real than anything in this world. I promise you, the day I finally hold your hand in front of me, every mile of waiting will turn into the sweetest memory.',
  },
  {
    id: 'card-3',
    title: 'Your Smile is My Home',
    tag: 'Little Joys',
    quote: 'Your smile is the purest thing I have ever known.',
    preview: 'A little shy, always cute, with that sweet smile that melts every worry away...',
    fullText:
      'A little shy, always cute, with that sweet smile that melts every worry away. Whether it is your joy over your favorite rasgulla and chamcham, your love for delicate white flowers, or the way you talk about our future — you make the world so much softer and warmer. Today and every day, I pray for your eternal smile.',
  },
  {
    id: 'card-4',
    title: 'Our Sacred Tomorrow',
    tag: 'Spiritual Blessing',
    quote: 'May the universe shower our path with health, peace, and eternal togetherness.',
    preview: 'You are spiritual, deeply kind, and pure at heart...',
    fullText:
      'You are spiritual, deeply kind, and pure at heart. I pray that this year brings you abundant blessings, peace in your heart, success in everything you cherish, and the fulfillment of every little dream we have shared. Standing beside you in Vrindavan and Kedarnath one day is one of my deepest prayers.',
  },
];

// Interactive Surprises
interface SurpriseItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  revealTitle: string;
  revealContent: string;
  actionText?: string;
}

const SURPRISES: SurpriseItem[] = [
  {
    id: 'rasgulla',
    title: 'A Sweet Treat for My Queen',
    subtitle: 'Prepared just for your sweet tooth',
    icon: '🍬',
    badge: 'Your Favorites',
    revealTitle: 'Sweet Rasgulla & Chamcham Just for You! 🤍',
    revealContent:
      'Tender, sweet rasgulla and delicate chamcham — your absolute favorites! There is nothing sweeter in this entire world, except that shy, adorable smile of yours when you take your first bite. Sending you a million sweet wishes today, bchu!',
  },
  {
    id: 'flowers',
    title: 'A Shower of White Blossoms',
    subtitle: 'Because you love flowers',
    icon: '🌸',
    badge: 'Blossoms',
    revealTitle: 'Delicate White Flowers for My Love 🤍',
    revealContent:
      'You have always loved flowers, and whenever I think of white blossoms, I think of your elegance, your grace, and the effortless beauty you bring whenever you wear your favorite suits. May your life be as fragrant and graceful as a garden of fresh white jasmine and lilies.',
  },
  {
    id: 'handhold',
    title: 'A Sacred Promise',
    subtitle: 'The day we finally meet',
    icon: '🤝',
    badge: 'Our Future',
    revealTitle: 'My Forever Promise to You ❤️',
    revealContent:
      'We have spent years speaking from our hearts without having stood face to face. My sacred promise to you on your birthday is this: the moment we meet, I will hold you close, look into your eyes, and thank God for the day you came into my life. Every travel dream on our list, we will live it together.',
  },
  {
    id: 'prayer',
    title: 'A Spiritual Prayer for Your Birthday',
    subtitle: 'Blessings for peace & health',
    icon: '✨',
    badge: 'Blessings',
    revealTitle: 'Spiritual Blessings & Prayers for Ray 🙏',
    revealContent:
      'On this sacred day, I pray to the Almighty for your lifelong health, joy, peace, and unwavering smile. May your spiritual strength guide you, may every prayer you whisper be answered, and may our love remain protected under divine grace forever.',
  },
];

export function BirthdayCelebrationHome() {
  const { user, partner, couple, openMediaViewer, triggerHeartEffect } = useApp();
  const [bData, setBData] = useState<BirthdayData | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [savedDreams, setSavedDreams] = useState<Set<string>>(new Set());

  // Active Modals & Previews
  const [activeCard, setActiveCard] = useState<typeof BIRTHDAY_CARDS[0] | null>(null);
  const [activeSurprise, setActiveSurprise] = useState<SurpriseItem | null>(null);
  const [selectedDreamCategory, setSelectedDreamCategory] = useState<string>('All');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Ray's photo resolution (works whether Desh or Ray is viewing)
  const rayPhoto = partner?.name === 'Desh' ? user?.avatar : (partner?.avatar || user?.avatar);

  // New Memory / Wish upload state for Desh (Planner)
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadMediaUrl, setUploadMediaUrl] = useState('');
  const [uploadMediaType, setUploadMediaType] = useState<'photo' | 'video'>('photo');
  const [isSubmittingMedia, setIsSubmittingMedia] = useState(false);

  // Scrapbook Photos State
  interface ScrapbookItem {
    id: string;
    url: string;
    title: string;
    note: string;
    tag: string;
    date: string;
    rotation?: string;
  }

  const [customScrapbookPhotos, setCustomScrapbookPhotos] = useState<ScrapbookItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ray_birthday_scrapbook_photos');
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isUploadingScrapbook, setIsUploadingScrapbook] = useState(false);
  const scrapbookFileInputRef = React.useRef<HTMLInputElement>(null);

  // Gallery Assets from Media Library
  const [galleryAssets, setGalleryAssets] = useState<MediaAsset[]>([]);

  // Persistent photo overrides for Message Cards and Surprise Boxes
  const [cardPhotoOverrides, setCardPhotoOverrides] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ray_birthday_card_photos');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return {};
  });

  const [surprisePhotoOverrides, setSurprisePhotoOverrides] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ray_birthday_surprise_photos');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return {};
  });

  // Target for media picker modal
  const [pickerTarget, setPickerTarget] = useState<
    | { type: 'scrapbook' }
    | { type: 'card'; id: string; title: string }
    | { type: 'surprise'; id: string; title: string }
    | null
  >(null);

  const getCardPhoto = (cardId: string, index: number): string => {
    if (cardPhotoOverrides[cardId]) return cardPhotoOverrides[cardId];
    if (galleryAssets.length > 0) {
      return galleryAssets[index % galleryAssets.length]?.url || rayPhoto || '';
    }
    return rayPhoto || '';
  };

  const getSurprisePhoto = (surpriseId: string, index: number): string => {
    if (surprisePhotoOverrides[surpriseId]) return surprisePhotoOverrides[surpriseId];
    if (galleryAssets.length > 0) {
      return galleryAssets[(index + 2) % galleryAssets.length]?.url || galleryAssets[index % galleryAssets.length]?.url || rayPhoto || '';
    }
    return rayPhoto || '';
  };

  const saveCustomScrapbookPhotos = (items: ScrapbookItem[]) => {
    setCustomScrapbookPhotos(items);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ray_birthday_scrapbook_photos', JSON.stringify(items));
      } catch {
        // ignore
      }
    }
  };

  const handleUploadScrapbookFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingScrapbook(true);
    try {
      const uploadObj = mediaService.uploadFile(file, {
        categories: ['birthday', 'scrapbook'],
        title: `${partner?.name || 'Ray'} Birthday Scrapbook Photo`,
      });
      const res = await uploadObj.promise;
      if (res.success && res.data?.url) {
        const newItem: ScrapbookItem = {
          id: `sb_${Date.now()}`,
          url: res.data.url,
          title: file.name.replace(/\.[^/.]+$/, ''),
          note: 'A precious captured photograph of Ray added to our keepsake scrapbook.',
          tag: 'Keepsake Photo',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          rotation: Math.random() > 0.5 ? 'rotate-[1.5deg]' : 'rotate-[-1.5deg]',
        };
        saveCustomScrapbookPhotos([newItem, ...customScrapbookPhotos]);
        triggerHeartEffect();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#cccccc'],
        });
      } else {
        alert('Failed to upload scrapbook photo to Cloudinary');
      }
    } catch (err: any) {
      alert(`Scrapbook photo upload error: ${err?.message || 'Upload failed'}`);
    } finally {
      setIsUploadingScrapbook(false);
      if (scrapbookFileInputRef.current) scrapbookFileInputRef.current.value = '';
    }
  };

  const handleSelectFromLibrary = (selectedAssets: MediaAsset[]) => {
    if (!selectedAssets || selectedAssets.length === 0) return;

    if (pickerTarget?.type === 'card') {
      const updated = { ...cardPhotoOverrides, [pickerTarget.id]: selectedAssets[0].url };
      setCardPhotoOverrides(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('ray_birthday_card_photos', JSON.stringify(updated));
        } catch {}
      }
    } else if (pickerTarget?.type === 'surprise') {
      const updated = { ...surprisePhotoOverrides, [pickerTarget.id]: selectedAssets[0].url };
      setSurprisePhotoOverrides(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('ray_birthday_surprise_photos', JSON.stringify(updated));
        } catch {}
      }
    } else {
      const newItems: ScrapbookItem[] = selectedAssets.map((asset, i) => ({
        id: `sb_asset_${asset.id || Date.now()}_${i}`,
        url: asset.url,
        title: asset.title || 'Ray Photograph',
        note: asset.description || asset.caption || 'A treasured photograph of Ray from our sanctuary media library.',
        tag: 'Sanctuary Photo',
        date: new Date(asset.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rotation: i % 2 === 0 ? 'rotate-[2deg]' : 'rotate-[-2deg]',
      }));
      saveCustomScrapbookPhotos([...newItems, ...customScrapbookPhotos]);
    }

    setIsMediaPickerOpen(false);
    setPickerTarget(null);
    triggerHeartEffect();
  };

  const handleRemoveScrapbookPhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customScrapbookPhotos.filter(item => item.id !== id);
    saveCustomScrapbookPhotos(updated);
  };

  useEffect(() => {
    birthdayService.getBirthdayData().then(res => setBData(res.data ?? null));
    memoryService.getMemories().then(res => setMemories(res.data ?? []));
    mediaService.getMedia({ limit: 50 }).then(res => {
      if (res.data?.items) {
        const imgs = res.data.items.filter(item => item.mediaType === 'image' || !item.mediaType);
        setGalleryAssets(imgs);
      }
    });
    bucketListService.getItems().then(res => {
      if (res.data) {
        const set = new Set(res.data.map(i => i.title.toLowerCase()));
        setSavedDreams(set);
      }
    });

    const unsubB = birthdayService.subscribe(setBData);
    const unsubM = memoryService.subscribe(setMemories);
    const unsubMedia = mediaService.subscribe(assets => {
      if (assets) {
        const imgs = assets.filter(item => item.mediaType === 'image' || !item.mediaType);
        setGalleryAssets(imgs);
      }
    });
    return () => {
      unsubB();
      unsubM();
      unsubMedia();
    };
  }, []);

  const handleOpenSurprise = (surprise: SurpriseItem) => {
    setActiveSurprise(surprise);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#f5f5f5', '#d4d4d4', '#e2e8f0'],
    });
    triggerHeartEffect();
  };

  const handleSaveDream = async (dream: TravelDream) => {
    if (savedDreams.has(dream.name.toLowerCase())) return;

    await bucketListService.addItem({
      title: `${dream.name} (${dream.location})`,
      description: `${dream.description} • ${dream.whySpecial}`,
      category: 'Travel',
      priority: 'dream',
      targetDate: '2027-11-01T00:00:00.000Z',
      addedById: user?.id || 'partner1',
    });

    setSavedDreams(prev => new Set([...prev, dream.name.toLowerCase()]));
    triggerHeartEffect();
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#ffffff', '#cccccc'],
    });
  };

  const handleAddMediaMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadMediaUrl.trim()) return;

    setIsSubmittingMedia(true);
    try {
      await memoryService.createMemory({
        title: uploadTitle.trim(),
        description: uploadCaption.trim() || 'A precious moment in our relationship',
        date: new Date().toISOString(),
        coverUrl: uploadMediaUrl.trim(),
        mediaUrls: [uploadMediaUrl.trim()],
        category: 'Birthdays',
        tags: ['birthday', 'precious'],
        isFavorite: true,
        addedById: user?.id || 'partner1',
      });

      setUploadTitle('');
      setUploadCaption('');
      setUploadMediaUrl('');
      setIsManageModalOpen(false);
      triggerHeartEffect();
    } catch (err) {
      console.error('Failed to add memory:', err);
    } finally {
      setIsSubmittingMedia(false);
    }
  };

  const filteredDreams = DREAM_DESTINATIONS.filter(d => {
    if (selectedDreamCategory === 'All') return true;
    return d.category === selectedDreamCategory;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 space-y-12 select-none text-white">
      {/* 1. HERO CELEBRATION BANNER */}
      <div className="relative rounded-3xl border border-white/15 bg-gradient-to-b from-[#181818] via-[#0E0E0E] to-[#080808] p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden">
        {/* Soft starlight glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          {/* Real Photograph of Ray in Hero Banner */}
          {rayPhoto && (
            <div className="relative group my-1">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-white/20 via-rose-500/10 to-white/5 blur-lg" />
              <img
                src={rayPhoto}
                alt="Ray"
                onClick={() => openMediaViewer([rayPhoto], 0, { title: 'Happy Birthday Ray ❤️', description: 'Our beautiful queen on her special day.' })}
                className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover border-2 border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] cursor-pointer group-hover:scale-105 transition-transform"
              />
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-black/90 border border-white/20 flex items-center justify-center shadow-md">
                <Heart className="h-4 w-4 fill-white text-white" />
              </div>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono uppercase tracking-[0.2em] text-[#AAAAAA]">
            <Cake className="h-3.5 w-3.5 text-white" />
            <span>Today is All About Ray • November 1</span>
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-light text-white tracking-wide">
            Happy Birthday, My Queen ❤️
          </h1>

          <p className="font-serif italic text-sm sm:text-base text-[#D0D0D0] max-w-xl font-light leading-relaxed">
            &ldquo;Every smile of yours is a blessing, every dream we share is a promise, and every step of our journey is sacred to me.&rdquo;
          </p>

          {/* Quick stats / milestones */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#CCCCCC]">
              Started Talking: <span className="text-white font-medium">Sept 24, 2026</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#CCCCCC]">
              Officially Us: <span className="text-white font-medium">Sept 27, 2026</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#CCCCCC]">
              Love Status: <span className="text-white font-medium">Forever &amp; Always</span>
            </div>
          </div>

          {/* Planner action: Add & Manage Media */}
          <div className="pt-2">
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-white transition-all shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Real Photo / Video / Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SECTION A: BIRTHDAY MESSAGE CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#888888]">
              <Quote className="h-3.5 w-3.5 text-white" />
              <span>Section A</span>
            </div>
            <h2 className="font-serif text-2xl font-light text-white">Birthday Message Cards</h2>
          </div>
          <span className="text-xs text-[#777777] font-light">Tap to open full message</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BIRTHDAY_CARDS.map((card, idx) => {
            const photo = getCardPhoto(card.id, idx);
            return (
              <motion.div
                key={card.id}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCard(card)}
                className="cursor-pointer rounded-2xl bg-gradient-to-b from-[#161616] to-[#0D0D0D] border border-white/10 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col justify-between space-y-3 group transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-wider text-[#AAAAAA]">
                    {card.tag}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerTarget({ type: 'card', id: card.id, title: card.title });
                        setIsMediaPickerOpen(true);
                      }}
                      title="Pick photo from gallery"
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[#888888] hover:text-white transition-colors"
                    >
                      <ImageIcon className="h-3 w-3" />
                    </button>
                    <Heart className="h-4 w-4 text-white/50 group-hover:text-white transition-colors" />
                  </div>
                </div>

                {/* Real Photograph from Gallery */}
                {photo && (
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-inner group/photo">
                    <img
                      src={photo}
                      alt={card.title}
                      className="h-full w-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-2 left-2 text-[9px] font-mono text-white/80 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/10">
                      📸 Gallery Photo
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="font-serif text-lg text-white font-normal group-hover:underline">
                    {card.title}
                  </h3>
                  <p className="font-serif italic text-xs text-[#888888] mt-1 line-clamp-1">
                    &ldquo;{card.quote}&rdquo;
                  </p>
                  <p className="text-xs text-[#B0B0B0] mt-2 line-clamp-2 font-light leading-relaxed">
                    {card.preview}
                  </p>
                </div>

                <div className="text-[11px] font-mono text-white/60 flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1 group-hover:text-white">
                    <span>Read Full Card</span>
                    <span>→</span>
                  </span>
                  <span className="text-[10px] text-[#777777]">Tap to open</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. SECTION B: GIFTS AND SURPRISES */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#888888]">
            <Gift className="h-3.5 w-3.5 text-white" />
            <span>Section B</span>
          </div>
          <h2 className="font-serif text-2xl font-light text-white">Gifts &amp; Surprises</h2>
          <p className="text-xs text-[#888888] font-light">
            Interactive surprise boxes prepared with all my love. Tap each one to unwrap.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SURPRISES.map((item, idx) => {
            const photo = getSurprisePhoto(item.id, idx);
            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleOpenSurprise(item)}
                className="cursor-pointer rounded-2xl bg-[#141414] border border-white/10 p-4 shadow-lg flex flex-col items-center text-center space-y-3 group transition-all relative overflow-hidden"
              >
                {/* Gallery Photo Frame for Surprise */}
                {photo ? (
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-inner group/surp">
                    <img
                      src={photo}
                      alt={item.title}
                      className="h-full w-full object-cover group-hover/surp:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-black/75 border border-white/20 flex items-center justify-center text-sm shadow-md">
                      {item.icon}
                    </div>
                    <span className="absolute bottom-1.5 left-2 text-[9px] font-mono text-white/80 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs border border-white/10">
                      Surprise Gift
                    </span>
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                )}

                <div className="w-full">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#888888]">
                    {item.badge}
                  </span>
                  <h4 className="font-serif text-sm font-medium text-white mt-0.5 line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#888888] font-light mt-1 line-clamp-1">
                    {item.subtitle}
                  </p>
                </div>

                <button className="w-full py-1.5 rounded-xl bg-white/10 border border-white/15 text-[11px] font-medium text-white group-hover:bg-white group-hover:text-black transition-all">
                  Unwrap Box ✨
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 4. SECTION C: MEMORY GALLERY (ACTUAL UPLOADS ONLY) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#888888]">
              <Sparkles className="h-3.5 w-3.5 text-white" />
              <span>Section C</span>
            </div>
            <h2 className="font-serif text-2xl font-light text-white">Our Real Memory Gallery</h2>
            <p className="text-xs text-[#888888] font-light">
              Only authentic photographs &amp; videos uploaded by us. No fake generated experiences.
            </p>
          </div>

          <button
            onClick={() => setIsManageModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white flex items-center gap-1.5 transition-all"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Memory</span>
          </button>
        </div>

        {memories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 sm:p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="font-serif text-base text-white">Our Memory Vault is Ready</h4>
            <p className="text-xs text-[#888888] max-w-md mx-auto font-light leading-relaxed">
              We have not met in person yet, so every memory here will be real: the photos you upload, the videos you share, and the milestone days we celebrate together.
            </p>
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-medium shadow-md hover:bg-[#F0F0F0] transition-all"
            >
              Add First Memory Photo / Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {memories.map((m, i) => (
              <div
                key={m.id || i}
                onClick={() => openMediaViewer(m.mediaUrls || [m.coverUrl], 0, { title: m.title, description: m.description })}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-[#121212] cursor-pointer shadow-md"
              >
                <img
                  src={m.coverUrl}
                  alt={m.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <span className="text-xs font-medium text-white line-clamp-1">{m.title}</span>
                  {m.description && <span className="text-[10px] text-white/70 line-clamp-1">{m.description}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. SECTION D: DIGITAL HANDMADE SCRAPBOOK WITH RAY'S REAL PHOTOGRAPHS */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#888888]">
              <BookOpen className="h-3.5 w-3.5 text-white" />
              <span>Section D</span>
            </div>
            <h2 className="font-serif text-2xl font-light text-white">Digital Handmade Scrapbook</h2>
            <p className="text-xs text-[#888888] font-light">
              A personal collection of Ray&apos;s real photographs, handwritten notes, and polaroid keepsakes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={scrapbookFileInputRef}
              onChange={handleUploadScrapbookFile}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => scrapbookFileInputRef.current?.click()}
              disabled={isUploadingScrapbook}
              className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-[#EAEAEA] text-xs font-medium flex items-center gap-1.5 transition-all shadow-md"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{isUploadingScrapbook ? 'Uploading...' : 'Upload Scrapbook Photo'}</span>
            </button>
            <button
              onClick={() => setIsMediaPickerOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white flex items-center gap-1.5 transition-all"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Pick from Library</span>
            </button>
          </div>
        </div>

        {/* Polaroid Scrapbook Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Polaroid Card 01: Ray's Portrait */}
          <div className="relative rounded-2xl bg-[#141414] border border-white/15 p-5 shadow-2xl space-y-4 group transition-all hover:border-white/30">
            {/* Scrapbook Tape Sticker at top */}
            <div className="absolute -top-3 left-8 px-3.5 py-0.5 rounded-sm bg-white/15 border border-white/20 text-[9px] font-mono uppercase tracking-wider text-white rotate-[-2deg] shadow-sm backdrop-blur-xs">
              Note 01 • Her Grace
            </div>

            {/* Polaroid Photo Frame */}
            <div
              onClick={() => rayPhoto && openMediaViewer([rayPhoto], 0, { title: 'Ray — The Girl in the Suit', description: 'Effortless dignity and quiet grace.' })}
              className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black/60 border border-white/10 cursor-pointer shadow-inner group/img"
            >
              {rayPhoto ? (
                <img
                  src={rayPhoto}
                  alt="Ray"
                  className="h-full w-full object-cover group-hover/img:scale-104 transition-transform duration-300"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white/40">
                  <Heart className="h-12 w-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white text-xs gap-1 transition-opacity backdrop-blur-2xs">
                <Maximize2 className="h-4 w-4" />
                <span>View Full Photo</span>
              </div>
            </div>

            {/* Handwritten note caption */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🌸</span>
                <h4 className="font-serif text-base text-white">The Girl in the Suit</h4>
              </div>
              <p className="font-serif italic text-xs text-[#B8B8B8] leading-relaxed font-light">
                &ldquo;You usually love wearing suits, and there is a quiet, effortless dignity about how you carry yourself. Simple, natural, and never needing to be loud to be extraordinary.&rdquo;
              </p>
            </div>

            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] font-mono text-[#777777]">
              <span>Handwritten for Ray</span>
              <span>Nov 1, 2026</span>
            </div>
          </div>

          {/* Effective scrapbook photos (custom or automatically sourced from media library) */}
          {(() => {
            const effectiveScrapbookPhotos: ScrapbookItem[] = customScrapbookPhotos.length > 0
              ? customScrapbookPhotos
              : galleryAssets.map((asset, i) => ({
                  id: `sb_auto_${asset.id || i}`,
                  url: asset.url,
                  title: asset.title || `Ray — Keepsake Photo ${i + 1}`,
                  note: asset.caption || asset.description || 'A treasured captured photograph of Ray saved in our media library.',
                  tag: 'Gallery Photo',
                  date: new Date(asset.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                  rotation: i % 2 === 0 ? 'rotate-[1.5deg]' : 'rotate-[-1.5deg]',
                }));

            return effectiveScrapbookPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative rounded-2xl bg-[#141414] border border-white/15 p-5 shadow-2xl space-y-4 group transition-all hover:border-white/30"
              >
              {/* Tape Sticker */}
              <div className={`absolute -top-3 left-8 px-3.5 py-0.5 rounded-sm bg-white/15 border border-white/20 text-[9px] font-mono uppercase tracking-wider text-white ${photo.rotation || 'rotate-[1deg]'} shadow-sm backdrop-blur-xs`}>
                {photo.tag}
              </div>

              {/* Delete button on card hover */}
              <button
                onClick={(e) => handleRemoveScrapbookPhoto(photo.id, e)}
                title="Remove from scrapbook"
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/75 text-[#888888] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              {/* Photo Frame */}
              <div
                onClick={() => openMediaViewer([photo.url], 0, { title: photo.title, description: photo.note })}
                className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black/60 border border-white/10 cursor-pointer shadow-inner group/img"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="h-full w-full object-cover group-hover/img:scale-104 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white text-xs gap-1 transition-opacity backdrop-blur-2xs">
                  <Maximize2 className="h-4 w-4" />
                  <span>View Full Photo</span>
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-1.5 pt-1">
                <h4 className="font-serif text-base text-white">{photo.title}</h4>
                <p className="font-serif italic text-xs text-[#B8B8B8] leading-relaxed font-light">
                  &ldquo;{photo.note}&rdquo;
                </p>
              </div>

              <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] font-mono text-[#777777]">
                <span>Sanctuary Keepsake</span>
                <span>{photo.date || 'Captured Moment'}</span>
              </div>
            </div>
          ))}

          {/* Devotion Card: Note 02 */}
          <div className="relative rounded-2xl bg-[#141414] border border-white/15 p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-sm bg-white/10 border border-white/20 text-[9px] font-mono uppercase tracking-wider text-white rotate-[1deg] backdrop-blur-xs">
              Note 02 • Our Bond
            </div>
            <div className="pt-2 space-y-2">
              <span className="text-xl">❤️</span>
              <h4 className="font-serif text-base text-white">Years of Pure Devotion</h4>
              <p className="font-serif italic text-xs text-[#B0B0B0] leading-relaxed font-light">
                &ldquo;We haven&apos;t had coffee in the same room yet, but we have shared tears, late night dreams, and pure prayers. Our relationship was built on honesty, respect, and deep commitment.&rdquo;
              </p>
            </div>
            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] font-mono text-[#777777]">
              <span>Sanctuary Keepsake</span>
              <span>Forever</span>
            </div>
          </div>

          {/* Reserved for the Day We Meet Card: Note 03 */}
          <div className="relative rounded-2xl bg-[#141414] border border-white/15 p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-sm bg-white/10 border border-white/20 text-[9px] font-mono uppercase tracking-wider text-white rotate-[-1deg] backdrop-blur-xs">
              Note 03 • Reserved Space
            </div>
            <div className="pt-2 space-y-2">
              <span className="text-xl">📷</span>
              <h4 className="font-serif text-base text-white">Reserved for the Day We Meet</h4>
              <p className="font-serif italic text-xs text-[#B0B0B0] leading-relaxed font-light">
                &ldquo;This frame is intentionally kept waiting. The moment we take our very first real photograph together, it will live right here forever in our sanctuary.&rdquo;
              </p>
            </div>
            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] font-mono text-[#777777]">
              <span>Future Milestone</span>
              <span>With Blessings</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. SECTION E: OUR FUTURE DREAMS — PLACES WE WILL EXPLORE TOGETHER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#888888]">
              <Compass className="h-3.5 w-3.5 text-white" />
              <span>Section E</span>
            </div>
            <h2 className="font-serif text-2xl font-light text-white">
              Our Little Dreams — Places We Will Explore Together
            </h2>
            <p className="text-xs text-[#888888] font-light">
              Real destinations in India we dream of exploring hand in hand. Tap &quot;Save to Dream List&quot; to add to our shared bucket list.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto">
            {['All', 'Spiritual', 'Snow', 'Nature', 'Romantic'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedDreamCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedDreamCategory === cat
                    ? 'bg-white text-black shadow-sm'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDreams.map(dream => {
            const isSaved = savedDreams.has(dream.name.toLowerCase());
            return (
              <div
                key={dream.id}
                className="rounded-2xl bg-[#121212] border border-white/10 overflow-hidden shadow-lg flex flex-col justify-between group hover:border-white/20 transition-all"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                  <img
                    src={dream.image}
                    alt={dream.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-mono text-white">
                    {dream.category}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-[#888888]">
                      <MapPin className="h-3 w-3 text-white/60 shrink-0" />
                      <span>{dream.location}</span>
                    </div>
                    <h3 className="font-serif text-base text-white font-medium mt-1">
                      {dream.name}
                    </h3>
                    <p className="text-xs text-[#999999] mt-1 font-light leading-relaxed">
                      {dream.description}
                    </p>
                    <p className="text-[11px] text-[#CCCCCC] italic mt-2 border-l-2 border-white/20 pl-2">
                      &ldquo;{dream.whySpecial}&rdquo;
                    </p>
                  </div>

                  <button
                    onClick={() => handleSaveDream(dream)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      isSaved
                        ? 'bg-white/10 text-white border border-white/15 cursor-default'
                        : 'bg-white text-black hover:bg-[#E5E5E5] shadow-sm'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-white" />
                        <span>Saved to Our Dream List</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3.5 w-3.5" />
                        <span>Save to Our Dream List</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. SECTION F: WISHES & QUOTES */}
      <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-[#141414] to-[#0A0A0A] p-6 sm:p-8 space-y-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase text-[#888888]">
          <Heart className="h-3.5 w-3.5 text-white" />
          <span>Section F • My Eternal Wish For You</span>
        </div>
        <h3 className="font-serif text-2xl font-light text-white">
          May Your Life Be As Pure and Beautiful As Your Soul
        </h3>
        <p className="font-serif italic text-sm sm:text-base text-[#C0C0C0] max-w-2xl mx-auto leading-relaxed font-light">
          &ldquo;Ray, you bring calmness to my life. Today, as you step into a new year of your life, I want you to know that you will never have to walk alone. Through every dream, every prayer, and every travel road ahead, I am right here by your side. Happy Birthday, my love.&rdquo;
        </p>
      </div>

      {/* MODAL 1: CARD DETAIL */}
      <Modal
        isOpen={Boolean(activeCard)}
        onClose={() => setActiveCard(null)}
        title={activeCard?.title}
      >
        {activeCard && (() => {
          const cardIdx = BIRTHDAY_CARDS.findIndex(c => c.id === activeCard.id);
          const photo = getCardPhoto(activeCard.id, cardIdx >= 0 ? cardIdx : 0);

          return (
            <div className="space-y-4 p-2 text-white">
              {/* High-res Photo Header */}
              {photo && (
                <div
                  onClick={() => openMediaViewer([photo], 0, { title: activeCard.title, description: activeCard.quote })}
                  className="relative aspect-[16/9] sm:aspect-[2/1] w-full rounded-2xl overflow-hidden bg-black/80 border border-white/15 cursor-pointer shadow-lg group/modalImg"
                >
                  <img
                    src={photo}
                    alt={activeCard.title}
                    className="h-full w-full object-cover group-hover/modalImg:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white">
                    <span className="bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                      📸 Real Photograph • Tap to Zoom
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerTarget({ type: 'card', id: activeCard.id, title: activeCard.title });
                        setIsMediaPickerOpen(true);
                      }}
                      className="bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/20 text-white flex items-center gap-1 transition-all"
                    >
                      <ImageIcon className="h-3 w-3" />
                      <span>Change Photo</span>
                    </button>
                  </div>
                </div>
              )}

              <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-mono uppercase tracking-wider text-[#CCCCCC]">
                {activeCard.tag}
              </span>
              <blockquote className="font-serif italic text-sm text-[#AAAAAA] border-l-2 border-white/30 pl-3">
                &ldquo;{activeCard.quote}&rdquo;
              </blockquote>
              <p className="font-serif text-sm sm:text-base leading-relaxed text-[#E5E5E5] font-light whitespace-pre-line pt-2">
                {activeCard.fullText}
              </p>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <button
                  onClick={() => {
                    setPickerTarget({ type: 'card', id: activeCard.id, title: activeCard.title });
                    setIsMediaPickerOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-[#CCCCCC] hover:text-white hover:bg-white/15 flex items-center gap-1.5 transition-all"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Pick from Gallery</span>
                </button>
                <button
                  onClick={() => setActiveCard(null)}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-[#E0E0E0] transition-colors"
                >
                  Close Card ❤️
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* MODAL 2: SURPRISE UNWRAP */}
      <Modal
        isOpen={Boolean(activeSurprise)}
        onClose={() => setActiveSurprise(null)}
        title={activeSurprise?.revealTitle}
      >
        {activeSurprise && (() => {
          const surpIdx = SURPRISES.findIndex(s => s.id === activeSurprise.id);
          const photo = getSurprisePhoto(activeSurprise.id, surpIdx >= 0 ? surpIdx : 0);

          return (
            <div className="space-y-4 p-2 text-center text-white">
              {/* High-res Surprise Photo Header */}
              {photo && (
                <div
                  onClick={() => openMediaViewer([photo], 0, { title: activeSurprise.revealTitle, description: activeSurprise.revealContent })}
                  className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black/80 border border-white/15 cursor-pointer shadow-lg group/surpModal"
                >
                  <img
                    src={photo}
                    alt={activeSurprise.title}
                    className="h-full w-full object-cover group-hover/surpModal:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white">
                    <span className="bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                      📸 Real Photograph • Tap to Zoom
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerTarget({ type: 'surprise', id: activeSurprise.id, title: activeSurprise.title });
                        setIsMediaPickerOpen(true);
                      }}
                      className="bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/20 text-white flex items-center gap-1 transition-all"
                    >
                      <ImageIcon className="h-3 w-3" />
                      <span>Change Photo</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-2xl mx-auto shadow-inner animate-bounce">
                {activeSurprise.icon}
              </div>

              <p className="font-serif text-sm sm:text-base text-[#D0D0D0] leading-relaxed font-light px-2">
                {activeSurprise.revealContent}
              </p>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setPickerTarget({ type: 'surprise', id: activeSurprise.id, title: activeSurprise.title });
                    setIsMediaPickerOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-[#CCCCCC] hover:text-white hover:bg-white/15 flex items-center gap-1.5 transition-all"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Pick from Gallery</span>
                </button>
                <button
                  onClick={() => setActiveSurprise(null)}
                  className="px-6 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-[#E0E0E0] shadow-md transition-all"
                >
                  Cherish Surprise ✨
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* MODAL 3: MANAGE / ADD MEDIA FOR DESH */}
      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title="Add Real Memory Photo, Video, or Note"
      >
        <form onSubmit={handleAddMediaMemory} className="space-y-4 p-2 text-white">
          <p className="text-xs text-[#888888] font-light">
            Easily upload your real photographs, videos, or memories here. They will immediately appear in the birthday gallery.
          </p>

          <div>
            <label className="block text-xs font-mono uppercase text-[#AAAAAA] mb-1">
              Memory Title
            </label>
            <input
              type="text"
              value={uploadTitle}
              onChange={e => setUploadTitle(e.target.value)}
              placeholder="e.g. A photo you sent me that stole my heart"
              required
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#AAAAAA] mb-1">
              Image or Video URL
            </label>
            <input
              type="url"
              value={uploadMediaUrl}
              onChange={e => setUploadMediaUrl(e.target.value)}
              placeholder="https://... or uploaded asset link"
              required
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#AAAAAA] mb-1">
              Romantic Caption / Note
            </label>
            <textarea
              value={uploadCaption}
              onChange={e => setUploadCaption(e.target.value)}
              placeholder="Add your heartfelt thoughts about this photo/moment..."
              rows={3}
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsManageModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/10 text-xs text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingMedia}
              className="px-5 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-[#E0E0E0] transition-colors"
            >
              {isSubmittingMedia ? 'Saving...' : 'Save to Gallery'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Media Picker Modal for selecting uploaded photos of Ray */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => {
          setIsMediaPickerOpen(false);
          setPickerTarget(null);
        }}
        onSelect={handleSelectFromLibrary}
        multiple={pickerTarget?.type === 'scrapbook' || !pickerTarget}
        title={
          pickerTarget?.type === 'card'
            ? `Choose Photo for "${pickerTarget.title}"`
            : pickerTarget?.type === 'surprise'
            ? `Choose Photo for "${pickerTarget.title}"`
            : "Add Ray's Photographs to Scrapbook"
        }
        description={
          pickerTarget?.type === 'card' || pickerTarget?.type === 'surprise'
            ? "Pick any real uploaded photograph from your sanctuary media library to display on this card."
            : "Select authentic photographs of Ray from our centralized media library to feature in her keepsake scrapbook."
        }
        allowedMediaType="image"
        defaultCategory="all"
      />
    </div>
  );
}
