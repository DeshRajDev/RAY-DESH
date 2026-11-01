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
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '@/stores/app-context';
import { bucketListService } from '@/services/bucketList.service';
import { memoryService } from '@/services/memory.service';
import { birthdayService } from '@/services/birthday.service';
import { BirthdayData, Memory } from '@/types';
import { Modal } from '@/components/ui/modal';

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
    title: 'To My Beautiful Rey',
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
    revealTitle: 'Spiritual Blessings & Prayers for Rey 🙏',
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

  // New Memory / Wish upload state for Desh (Planner)
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadMediaUrl, setUploadMediaUrl] = useState('');
  const [uploadMediaType, setUploadMediaType] = useState<'photo' | 'video'>('photo');
  const [isSubmittingMedia, setIsSubmittingMedia] = useState(false);

  useEffect(() => {
    birthdayService.getBirthdayData().then(res => setBData(res.data ?? null));
    memoryService.getMemories().then(res => setMemories(res.data ?? []));
    bucketListService.getItems().then(res => {
      if (res.data) {
        const set = new Set(res.data.map(i => i.title.toLowerCase()));
        setSavedDreams(set);
      }
    });

    const unsubB = birthdayService.subscribe(setBData);
    const unsubM = memoryService.subscribe(setMemories);
    return () => {
      unsubB();
      unsubM();
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono uppercase tracking-[0.2em] text-[#AAAAAA]">
            <Cake className="h-3.5 w-3.5 text-white" />
            <span>Today is All About Rey • November 1</span>
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
          {BIRTHDAY_CARDS.map(card => (
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
                <Heart className="h-4 w-4 text-white/50 group-hover:text-white transition-colors" />
              </div>

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

              <div className="text-[11px] font-mono text-white/60 flex items-center gap-1 group-hover:text-white pt-1">
                <span>Read Full Card</span>
                <span>→</span>
              </div>
            </motion.div>
          ))}
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
          {SURPRISES.map(item => (
            <motion.div
              key={item.id}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleOpenSurprise(item)}
              className="cursor-pointer rounded-2xl bg-[#141414] border border-white/10 p-5 shadow-lg flex flex-col items-center text-center space-y-3 group transition-all relative overflow-hidden"
            >
              <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                {item.icon}
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#888888]">
                  {item.badge}
                </span>
                <h4 className="font-serif text-sm font-medium text-white mt-0.5">
                  {item.title}
                </h4>
                <p className="text-[11px] text-[#888888] font-light mt-1">
                  {item.subtitle}
                </p>
              </div>

              <button className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-[11px] font-medium text-white group-hover:bg-white group-hover:text-black transition-all">
                Unwrap Box ✨
              </button>
            </motion.div>
          ))}
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

      {/* 5. SECTION D: DIGITAL SCRAPBOOK */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#888888]">
            <BookOpen className="h-3.5 w-3.5 text-white" />
            <span>Section D</span>
          </div>
          <h2 className="font-serif text-2xl font-light text-white">Digital Handmade Scrapbook</h2>
          <p className="text-xs text-[#888888] font-light">
            Crafted like a handmade scrapbook of love, personal notes, and sacred promises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scrapbook Page 1 */}
          <div className="relative rounded-2xl bg-[#141414] border border-white/15 p-6 shadow-xl space-y-4">
            <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-md bg-white/10 border border-white/20 text-[9px] font-mono uppercase tracking-wider text-white rotate-[-2deg]">
              Note 01 • Her Grace
            </div>
            <div className="pt-2">
              <span className="text-xl">🌸</span>
              <h4 className="font-serif text-base text-white mt-1">The Girl in the Suit</h4>
              <p className="font-serif italic text-xs text-[#B0B0B0] leading-relaxed mt-2 font-light">
                &ldquo;You usually love wearing suits, and there is a quiet, effortless dignity about how you carry yourself. Simple, natural, and never needing to be loud to be extraordinary.&rdquo;
              </p>
            </div>
            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] font-mono text-[#777777]">
              <span>Handwritten for Rey</span>
              <span>Nov 1, 2026</span>
            </div>
          </div>

          {/* Scrapbook Page 2 */}
          <div className="relative rounded-2xl bg-[#141414] border border-white/15 p-6 shadow-xl space-y-4">
            <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-md bg-white/10 border border-white/20 text-[9px] font-mono uppercase tracking-wider text-white rotate-[1deg]">
              Note 02 • Our Bond
            </div>
            <div className="pt-2">
              <span className="text-xl">❤️</span>
              <h4 className="font-serif text-base text-white mt-1">Years of Pure Devotion</h4>
              <p className="font-serif italic text-xs text-[#B0B0B0] leading-relaxed mt-2 font-light">
                &ldquo;We haven&apos;t had coffee in the same room yet, but we have shared tears, late night dreams, and pure prayers. Our relationship was built on honesty, respect, and deep commitment.&rdquo;
              </p>
            </div>
            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] font-mono text-[#777777]">
              <span>Sanctuary Keepsake</span>
              <span>Forever</span>
            </div>
          </div>

          {/* Scrapbook Page 3 */}
          <div className="relative rounded-2xl bg-[#141414] border border-white/15 p-6 shadow-xl space-y-4">
            <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-md bg-white/10 border border-white/20 text-[9px] font-mono uppercase tracking-wider text-white rotate-[-1deg]">
              Note 03 • Reserved Space
            </div>
            <div className="pt-2">
              <span className="text-xl">📷</span>
              <h4 className="font-serif text-base text-white mt-1">Reserved for the Day We Meet</h4>
              <p className="font-serif italic text-xs text-[#B0B0B0] leading-relaxed mt-2 font-light">
                &ldquo;This frame is intentionally kept waiting. The moment we take our very first real photograph together, it will live right here forever in our sanctuary.&rdquo;
              </p>
            </div>
            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] font-mono text-[#777777]">
              <span>Future Memory</span>
              <span>Soon InshaAllah / With Blessings</span>
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
          &ldquo;Rey, you bring calmness to my life. Today, as you step into a new year of your life, I want you to know that you will never have to walk alone. Through every dream, every prayer, and every travel road ahead, I am right here by your side. Happy Birthday, my love.&rdquo;
        </p>
      </div>

      {/* MODAL 1: CARD DETAIL */}
      <Modal
        isOpen={Boolean(activeCard)}
        onClose={() => setActiveCard(null)}
        title={activeCard?.title}
      >
        {activeCard && (
          <div className="space-y-4 p-2 text-white">
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-mono uppercase tracking-wider text-[#CCCCCC]">
              {activeCard.tag}
            </span>
            <blockquote className="font-serif italic text-sm text-[#AAAAAA] border-l-2 border-white/30 pl-3">
              &ldquo;{activeCard.quote}&rdquo;
            </blockquote>
            <p className="font-serif text-sm sm:text-base leading-relaxed text-[#E5E5E5] font-light whitespace-pre-line pt-2">
              {activeCard.fullText}
            </p>
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setActiveCard(null)}
                className="px-4 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-[#E0E0E0] transition-colors"
              >
                Close Card ❤️
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: SURPRISE UNWRAP */}
      <Modal
        isOpen={Boolean(activeSurprise)}
        onClose={() => setActiveSurprise(null)}
        title={activeSurprise?.revealTitle}
      >
        {activeSurprise && (
          <div className="space-y-4 p-2 text-center text-white">
            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-3xl mx-auto shadow-inner animate-bounce">
              {activeSurprise.icon}
            </div>

            <p className="font-serif text-sm sm:text-base text-[#D0D0D0] leading-relaxed font-light px-2">
              {activeSurprise.revealContent}
            </p>

            <div className="pt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setActiveSurprise(null)}
                className="px-6 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-[#E0E0E0] shadow-md transition-all"
              >
                Cherish Surprise ✨
              </button>
            </div>
          </div>
        )}
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
    </div>
  );
}
