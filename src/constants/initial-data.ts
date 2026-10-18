import { 
  User, 
  Couple, 
  Message, 
  Story, 
  Memory, 
  Post, 
  Song, 
  DateEvent, 
  BirthdayData, 
  BucketListItem, 
  Trip, 
  Place, 
  JournalEntry, 
  LoveLetter, 
  Milestone, 
  NotificationItem,
  Reel 
} from '@/types';

export const currentUser: User = {
  id: 'user_1',
  name: 'Desh',
  nickname: 'My Love',
  email: 'desh@couple.local',
  phoneNumber: '8580962780',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  bio: 'Building our cozy corner of the internet. Forever grateful for you, Rey.',
  birthday: '2004-05-15T00:00:00.000Z',
  favoriteSong: 'Samjhawan - Arijit Singh & Shreya Ghoshal',
  favoritePlace: 'Dal Lake Wooden Houseboat, Srinagar',
  favoriteQuote: 'In all the world, there is no heart for me like yours.',
  favoriteColor: '#171717',
  statusMessage: 'Thinking about our next midnight walk with Rey 🌙',
  isOnline: true,
  role: 'partner1',
};

export const partnerUser: User = {
  id: 'user_2',
  name: 'Rey',
  nickname: 'My Queen',
  email: 'rey@couple.local',
  phoneNumber: '9015006850',
  avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  bio: 'Coffee lover, stargazing enthusiast, and your biggest cheerleader ✨',
  birthday: '2005-11-01T00:00:00.000Z',
  favoriteSong: 'Love Note',
  favoritePlace: 'Old Town Cobblestone Lane, Prague',
  favoriteQuote: 'You are my sun, my moon, and all my stars.',
  favoriteColor: '#2A2A2A',
  statusMessage: 'Curled up reading with a warm cappuccino ☕',
  isOnline: true,
  lastSeen: 'Active just now',
  role: 'partner2',
};

export const initialCouple: Couple = {
  id: 'couple_1',
  partner1: currentUser,
  partner2: partnerUser,
  anniversaryDate: '2026-09-27T00:00:00.000Z',
  relationshipStartDate: '2026-09-27T00:00:00.000Z',
  theme: 'dark',
  customTitle: 'Ray — किरण',
  coupleAvatar: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
  soundEnabled: true,
  privacyPinEnabled: false,
};

export const initialMessages: Message[] = [
  {
    id: 'msg_welcome_1',
    senderId: 'user_1',
    receiverId: 'user_2',
    content: 'Hey Rey ❤️ Welcome to our private sanctuary! We started talking on September 24, 2026, officially became us on September 27, 2026, and now we have our forever digital home.',
    type: 'text',
    reactions: [{ emoji: '❤️', userId: 'user_2', timestamp: '2026-09-27T12:00:00.000Z' }],
    isRead: true,
    isDelivered: true,
    createdAt: '2026-09-27T10:00:00.000Z',
  },
  {
    id: 'msg_welcome_2',
    senderId: 'user_2',
    receiverId: 'user_1',
    content: 'I love our space so much Desh ✨ Everything here is preserved just for the two of us.',
    type: 'text',
    reactions: [{ emoji: '🥹', userId: 'user_1', timestamp: '2026-09-27T12:05:00.000Z' }],
    isRead: true,
    isDelivered: true,
    createdAt: '2026-09-27T10:05:00.000Z',
  }
];

export const initialStories: Story[] = [
  {
    id: 'story_1',
    authorId: 'user_2',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80',
    caption: 'Quiet autumn morning coffees with you are my favorite sanctuary ☕✨',
    createdAt: '2026-10-08T18:00:00.000Z',
    expiresAt: '2026-10-09T18:00:00.000Z',
    reactions: [{ emoji: '❤️', userId: 'user_1' }],
    replies: [{ id: 'reply_1', userId: 'user_1', text: 'Nothing beats making your brew every morning ❤️', createdAt: '2026-10-08T18:15:00.000Z' }]
  },
  {
    id: 'story_2',
    authorId: 'user_1',
    type: 'music',
    songTitle: 'Mystery of Love',
    songArtist: 'Sufjan Stevens',
    caption: 'On repeat all evening while working on our trip journal 🎵',
    createdAt: '2026-10-08T19:30:00.000Z',
    expiresAt: '2026-10-09T19:30:00.000Z',
    reactions: [{ emoji: '🥹', userId: 'user_2' }],
    replies: []
  },
  {
    id: 'story_3',
    authorId: 'user_2',
    type: 'text',
    text: 'Every memory we build here becomes a treasure I replay when I close my eyes.',
    backgroundColor: '#111111',
    caption: 'A midnight thought for us',
    createdAt: '2026-10-08T21:00:00.000Z',
    expiresAt: '2026-10-09T21:00:00.000Z',
    reactions: [{ emoji: '❤️', userId: 'user_1' }, { emoji: '🔥', userId: 'user_1' }],
    replies: []
  }
];

export const initialMemories: Memory[] = [
  {
    id: 'mem_1',
    title: 'The Night of September 27 — Our Beginning',
    description: 'Under the starlight, we promised to stand by each other through all seasons. The official beginning of Desh & Rey.',
    date: '2026-09-27T20:00:00.000Z',
    location: 'Rosewood Garden Terrace',
    category: 'Special Moments',
    coverUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80',
    mediaUrls: [
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['Anniversary', 'Sep 27', 'Desh & Rey', 'Beginning'],
    isFavorite: true,
    addedById: 'user_1',
    likes: 32,
    commentsCount: 4,
    createdAt: '2026-09-27T22:00:00.000Z',
  },
  {
    id: 'mem_2',
    title: 'September 24 — Our Very First Conversation',
    description: 'We started talking on September 24 and hours melted away like minutes. It felt like we had known each other across lifetimes.',
    date: '2026-09-24T16:00:00.000Z',
    location: 'Cozy Evening Chat',
    category: 'Dates',
    coverUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    mediaUrls: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['First Conversation', 'Sep 24', 'Connection', 'Spark'],
    isFavorite: true,
    addedById: 'user_2',
    likes: 28,
    commentsCount: 5,
    createdAt: '2026-09-24T23:00:00.000Z',
  },
  {
    id: 'mem_3',
    title: 'Sunrise Above the Misty Pine Valleys',
    description: 'We woke up early, wrapped in heavy wool blankets, sharing thermos chai as the golden light touched the mountain peaks.',
    date: '2026-10-02T05:45:00.000Z',
    location: 'Pahalgam Valley, Kashmir',
    category: 'Trips',
    coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    mediaUrls: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['Kashmir', 'Sunrise', 'Chai', 'Mountains'],
    isFavorite: true,
    addedById: 'user_1',
    likes: 18,
    commentsCount: 3,
    createdAt: '2026-10-02T08:00:00.000Z',
  },
  {
    id: 'mem_4',
    title: 'Surprise Midnight Starlight Picnic',
    description: 'You managed to hide the fairy lights and hand-baked cheesecake in the car boot without me noticing a single clue!',
    date: '2026-10-05T00:01:00.000Z',
    location: 'Ridge Vista Point',
    category: 'Special Moments',
    coverUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
    mediaUrls: [
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['Surprise', 'Cheesecake', 'Fairy Lights', 'Stargazing'],
    isFavorite: true,
    addedById: 'user_1',
    likes: 24,
    commentsCount: 6,
    createdAt: '2026-10-05T09:00:00.000Z',
  }
];

export const initialPosts: Post[] = [
  {
    id: 'post_1',
    authorId: 'user_2',
    authorName: 'Rey',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    type: 'photo',
    content: 'From our first conversation on Sep 24 to choosing each other on Sep 27, every single day with you feels like magic.',
    mediaUrls: [
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80'
    ],
    location: 'Our Sanctuary',
    date: '2026-10-07T19:30:00.000Z',
    likes: ['user_1', 'user_2'],
    reactions: [{ emoji: '❤️', userId: 'user_1' }, { emoji: '🥹', userId: 'user_1' }],
    comments: [
      {
        id: 'comm_1',
        userId: 'user_1',
        userName: 'Desh',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        text: 'Forever and always my favorite person in the entire universe, Rey.',
        createdAt: '2026-10-07T20:00:00.000Z'
      }
    ],
    isPinned: true,
    createdAt: '2026-10-07T19:30:00.000Z',
  },
  {
    id: 'post_2',
    authorId: 'user_1',
    authorName: 'Desh',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    type: 'music',
    content: 'Added this gem to our Shared Playlist! It captures that effortless feeling when we talk late into the night.',
    mediaUrls: [],
    song: {
      title: 'About You',
      artist: 'The 1975',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
    },
    location: 'Audio Sanctuary',
    date: '2026-10-05T14:15:00.000Z',
    likes: ['user_2'],
    reactions: [{ emoji: '🎵', userId: 'user_2' }, { emoji: '❤️', userId: 'user_2' }],
    comments: [
      {
        id: 'comm_2',
        userId: 'user_2',
        userName: 'Rey',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        text: 'Playing this on repeat! Reminds me of our late night talks.',
        createdAt: '2026-10-05T15:00:00.000Z'
      }
    ],
    createdAt: '2026-10-05T14:15:00.000Z',
  }
];

export const initialSongs: Song[] = [
  {
    id: 'song_1',
    title: 'Love Note',
    artist: 'Rey',
    album: 'Sanctuary Melodies',
    duration: 148,
    coverUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
    audioUrl: '/songs/Love%20Note.mp3',
    addedById: 'user_2',
    addedByName: 'Rey',
    dateAdded: '2026-09-24T14:30:00.000Z',
    isFavorite: true,
    category: 'Her Favorites',
    lyricsSnippet: 'A tender melody made for the quiet hours with you...',
    note: "Rey's absolute favorite song ❤️",
  },
  {
    id: 'song_2',
    title: 'Samjhawan',
    artist: 'Arijit Singh & Shreya Ghoshal',
    album: 'Humpty Sharma Ki Dulhania',
    duration: 270,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    audioUrl: '/songs/Samjhawan%20Humpty%20Sharma%20Ki%20Dulhania%20320%20Kbps.mp3',
    addedById: 'user_1',
    addedByName: 'Desh',
    dateAdded: '2026-09-27T10:00:00.000Z',
    isFavorite: true,
    category: 'My Favorites',
    lyricsSnippet: 'Main tenu samjhawan ki / Na tere bina lagda jee...',
    note: "Desh's favorite song ❤️",
  },
  {
    id: 'song_3',
    title: 'Holocene',
    artist: 'Bon Iver',
    album: 'Bon Iver',
    duration: 337,
    coverUrl: 'https://images.unsplash.com/photo-1445307806294-bff7f67ff225?w=600&auto=format&fit=crop&q=80',
    addedById: 'user_1',
    addedByName: 'Desh',
    dateAdded: '2026-09-28T11:20:00.000Z',
    isFavorite: true,
    category: 'My Favorites',
    lyricsSnippet: 'And at once I knew I was not magnificent / High above the highway...',
    note: 'Peaceful acoustic mornings with freshly brewed filter coffee.'
  },
  {
    id: 'song_4',
    title: 'Yellow',
    artist: 'Coldplay',
    album: 'Parachutes',
    duration: 269,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    addedById: 'user_2',
    addedByName: 'Rey',
    dateAdded: '2026-10-01T18:00:00.000Z',
    isFavorite: false,
    category: 'Recently Added',
    lyricsSnippet: 'Look at the stars, look how they shine for you...',
    note: 'Our starry night song.'
  },
  {
    id: 'song_5',
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
    album: 'Easy on My Eyes',
    duration: 177,
    coverUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&auto=format&fit=crop&q=80',
    addedById: 'user_1',
    addedByName: 'Desh',
    dateAdded: '2026-10-04T09:45:00.000Z',
    isFavorite: true,
    category: 'Most Played',
    lyricsSnippet: 'I would never fall in love until I found her...',
    note: 'Our official slow dance track in the kitchen.'
  }
];

export const initialDates: DateEvent[] = [
  {
    id: 'date_1',
    title: 'Our Anniversary (Sep 27)',
    date: '2026-09-27T00:00:00.000Z',
    type: 'Anniversary',
    description: 'The day we officially promised each other our hearts and made it our forever story.',
    location: 'Rosewood Garden',
    isRecurringYearly: true,
    photos: ['https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80'],
    notes: 'Always book candlelight dinner and recreate our first dance.',
    remindDaysBefore: [30, 7, 1]
  },
  {
    id: 'date_2',
    title: "Rey's Birthday 🎂",
    date: '2005-11-01T00:00:00.000Z',
    type: 'Birthday',
    description: 'Celebrating the birth of the most radiant soul in my world, Rey.',
    location: 'Home & Secret Getaway',
    isRecurringYearly: true,
    photos: ['https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'],
    notes: 'Secret gift list unlocked in the Birthday section.',
    remindDaysBefore: [60, 30, 14, 7, 1]
  },
  {
    id: 'date_3',
    title: 'First Conversation (Sep 24)',
    date: '2026-09-24T16:00:00.000Z',
    type: 'First Message',
    description: 'The unforgettable day we started talking. A connection that sparked into our forever sanctuary.',
    location: 'Our First Hello',
    isRecurringYearly: true,
    photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80'],
    notes: 'Sep 24, 2026 — the beginning of everything.',
    remindDaysBefore: [7, 1]
  },
  {
    id: 'date_4',
    title: 'Our Kashmir Winter Expedition',
    date: '2026-11-20T08:00:00.000Z',
    type: 'Trip',
    description: 'Sledding through Gulmarg snow and staying in a heated heritage shikara.',
    location: 'Srinagar & Gulmarg, Kashmir',
    isRecurringYearly: false,
    photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'],
    notes: 'Pack thermal base layers and camera waterproof bag.'
  },
  {
    id: 'date_5',
    title: "Desh's Birthday 🎉",
    date: '2004-05-15T00:00:00.000Z',
    type: 'Birthday',
    description: 'Celebrating Desh\'s special day with favorite homemade ramen and gaming marathon.',
    location: 'Our Apartment',
    isRecurringYearly: true,
    remindDaysBefore: [30, 7, 1]
  }
];

export const initialBirthdayData: BirthdayData = {
  partnerBirthday: '2005-11-01T00:00:00.000Z',
  myBirthday: '2004-05-15T00:00:00.000Z',
  partnerName: 'Rey',
  plans: [
    {
      id: 'bplan_1',
      title: 'Vintage Leatherbound Travel Journal with Custom Embossed Monogram',
      category: 'Gift Idea',
      status: 'purchased',
      budget: '$85',
      secret: true,
      notes: 'Hidden in the top left wardrobe compartment under the winter coats.',
      addedById: 'user_1'
    },
    {
      id: 'bplan_2',
      title: 'Private Starlit Glass Igloo Dinner Reservation',
      category: 'Surprise',
      status: 'planned',
      budget: '$220',
      secret: true,
      notes: 'Confirmed for 8 PM on Nov 1st. Live violin player requested.',
      addedById: 'user_1'
    },
    {
      id: 'bplan_3',
      title: 'Handmade 365 Notes of Love Jar',
      category: 'Message/Card',
      status: 'idea',
      budget: '$20',
      secret: true,
      notes: 'Write 1 short reason I love Rey on every individual slip.',
      addedById: 'user_1'
    }
  ],
  wishes: [
    {
      id: 'bwish_1',
      forUserId: 'user_2',
      addedById: 'user_2',
      title: 'FujiFilm Instax Wide 300 Instant Camera',
      description: 'To capture more retro wide film prints for our memory wall!',
      price: '$130',
      link: 'https://www.fujifilm.com',
      photoUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.instagram.com/reel/DeOofwmCelo/?exln=ZmI1dzJkNzV1YTkw',
      isClaimed: true
    },
    {
      id: 'bwish_2',
      forUserId: 'user_2',
      addedById: 'user_2',
      title: 'Artisanal Ceramic Matcha Bowl & Whisk Set',
      description: 'Handcrafted matte charcoal pottery for peaceful morning teas.',
      price: '$45',
      photoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
      isClaimed: false
    },
    {
      id: 'bwish_3',
      forUserId: 'user_1',
      addedById: 'user_1',
      title: 'Mechanical Keychron Custom Keyboard',
      description: 'Tactile quiet keys for late night coding and writing love notes.',
      price: '$110',
      photoUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
      isClaimed: false
    }
  ],
  specialMessageForPartner: 'To my favorite person in the entire universe: every single day with you is a gift I cherish more than words can ever capture. Happy Birthday, my love Rey ❤️',
  specialMessageFromPartner: 'Thank you Desh for making every ordinary day feel like a magical movie scene. I love you endlessly.'
};

export const initialBucketList: BucketListItem[] = [
  {
    id: 'bkt_1',
    title: 'Visit Prem Mandir & Watch the Evening Musical Light Show in Vrindavan',
    description: 'Walking hand in hand through the glowing white Italian marble temple with Radha Krishna bhajans playing softly.',
    category: 'Romantic',
    priority: 'dream',
    isCompleted: false,
    dateAdded: '2026-09-25T00:00:00.000Z',
    location: 'Prem Mandir, Vrindavan, Uttar Pradesh',
    addedById: 'user_1'
  },
  {
    id: 'bkt_2',
    title: 'Trek Together to Sacred Kamrunag Temple & Lake in the Misty Hills',
    description: 'Peaceful hike through quiet deodar pine forests to the mystical Himalayan lake and offering our heartfelt prayers for our future.',
    category: 'Adventure',
    priority: 'high',
    isCompleted: false,
    dateAdded: '2026-09-26T00:00:00.000Z',
    location: 'Kamrunag Lake, Mandi, Himachal Pradesh',
    photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80'],
    addedById: 'user_2'
  },
  {
    id: 'bkt_3',
    title: 'Experience Snowfall & Cozy Cafe Nights in Old Manali & Solang Valley',
    description: 'Sitting beside a wood-fired cafe oven, drinking hot chocolate, and waking up to fresh white snow outside our balcony.',
    category: 'Travel',
    priority: 'high',
    isCompleted: true,
    dateAdded: '2026-09-27T00:00:00.000Z',
    completedDate: '2026-10-04T18:30:00.000Z',
    location: 'Old Manali, Himachal Pradesh',
    photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'],
    notes: 'The Beas river sound and hot momos in the cold air were pure magic!',
    addedById: 'user_1'
  },
  {
    id: 'bkt_4',
    title: 'Evening Walk on Shimla Mall Road & The Ridge in Winter Fog',
    description: 'Wearing cozy sweaters, holding hands on the Mall Road, taking photos near the iconic Christ Church with misty mountain views.',
    category: 'Romantic',
    priority: 'high',
    isCompleted: false,
    dateAdded: '2026-09-28T00:00:00.000Z',
    location: 'The Ridge & Mall Road, Shimla',
    addedById: 'user_2'
  },
  {
    id: 'bkt_5',
    title: 'Sunset Shikara Ride on Dal Lake & Night Stay in a Wooden Houseboat',
    description: 'Gliding across lotus waters with Pir Panjal snow peaks reflected, sipping authentic saffron kahwa.',
    category: 'Romantic',
    priority: 'dream',
    isCompleted: true,
    dateAdded: '2026-09-29T00:00:00.000Z',
    completedDate: '2026-10-06T18:00:00.000Z',
    location: 'Dal Lake, Srinagar, Kashmir',
    photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'],
    addedById: 'user_1'
  },
  {
    id: 'bkt_6',
    title: 'Candlelight Dinner by Lake Pichola with City Palace Lights in Udaipur',
    description: 'A rooftop dinner over the water watching the royal palaces glow under the night sky.',
    category: 'Romantic',
    priority: 'high',
    isCompleted: false,
    dateAdded: '2026-10-01T00:00:00.000Z',
    location: 'Lake Pichola, Udaipur, Rajasthan',
    addedById: 'user_2'
  }
];

export const initialTrips: Trip[] = [
  {
    id: 'trip_1',
    title: 'Himachal Cozy Getaway — Manali, Solang & Kasol',
    destination: 'Manali, Solang Valley & Parvati Valley',
    country: 'India',
    startDate: '2026-10-01T00:00:00.000Z',
    endDate: '2026-10-06T00:00:00.000Z',
    coverPhoto: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    status: 'completed',
    locations: [
      { id: 'loc_1', name: 'Old Manali Wooden Cafes', date: '2026-10-02', notes: 'Hot chai and live acoustic indie songs' },
      { id: 'loc_2', name: 'Solang Valley Viewpoint', date: '2026-10-04', notes: 'Snowball fights and apple orchard walks' },
      { id: 'loc_3', name: 'Manikaran Hot Springs & Beas River', date: '2026-10-05', notes: 'Peaceful riverside meditation' }
    ],
    photos: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80'
    ],
    notes: 'Watching the morning mist roll over pine trees while sipping hot cutting chai together was unforgettable.',
    createdAt: '2026-09-28T00:00:00.000Z'
  },
  {
    id: 'trip_2',
    title: 'Divine Vrindavan & Mathura Spiritual Escape',
    destination: 'Prem Mandir, Banke Bihari & Yamuna Ghats',
    country: 'India',
    startDate: '2026-11-15T00:00:00.000Z',
    endDate: '2026-11-18T00:00:00.000Z',
    coverPhoto: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    status: 'planning',
    locations: [
      { id: 'loc_4', name: 'Prem Mandir Evening Light Darshan', notes: 'Watch the divine temple glow in rainbow lights' },
      { id: 'loc_5', name: 'Keshi Ghat Evening Aarti', notes: 'Float small handmade flower diyas in the sacred waters' }
    ],
    photos: [
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80'
    ],
    notes: 'Planning our quiet spiritual trip to seek blessings for our lifelong bond.',
    createdAt: '2026-10-01T00:00:00.000Z'
  }
];

export const initialPlaces: Place[] = [
  {
    id: 'plc_1',
    name: 'Prem Mandir',
    city: 'Vrindavan, Mathura',
    country: 'India',
    category: 'WantToGo',
    photos: ['https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80'],
    notes: 'Divine white marble temple with beautiful evening light show and serene gardens.',
    isFavorite: true,
    rating: 5,
    addedById: 'user_1'
  },
  {
    id: 'plc_2',
    name: 'Kamrunag Temple & Lake',
    city: 'Mandi, Himachal Pradesh',
    country: 'India',
    category: 'WantToGo',
    photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80'],
    notes: 'Hidden mystical lake amidst high mountain pine forests. Perfect quiet trek for us.',
    isFavorite: true,
    rating: 5,
    addedById: 'user_2'
  },
  {
    id: 'plc_3',
    name: 'The Ridge & Mall Road',
    city: 'Shimla, Himachal Pradesh',
    country: 'India',
    category: 'Been',
    photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'],
    notes: 'Romantic foggy evening walks, historic Christ church, and hot street coffee.',
    dateVisited: '2026-10-03T00:00:00.000Z',
    isFavorite: true,
    rating: 5,
    addedById: 'user_1'
  },
  {
    id: 'plc_4',
    name: 'Old Manali River Cafe',
    city: 'Manali, Himachal Pradesh',
    country: 'India',
    category: 'Been',
    photos: ['https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80'],
    notes: 'Sitting next to the flowing Beas river listening to acoustic music together.',
    dateVisited: '2026-10-05T00:00:00.000Z',
    isFavorite: true,
    rating: 5,
    addedById: 'user_2'
  }
];

export const initialJournal: JournalEntry[] = [
  {
    id: 'jnl_1',
    authorId: 'user_1',
    title: 'Watching you laugh in the passenger seat',
    content: 'Today we got hopelessly lost trying to find that secluded orchard. The GPS had given up, the playlist was on shuffle, and instead of getting frustrated, you rolled down the windows and started singing off-key at the top of your lungs. In that single moment, looking over at your profile against the golden hour light, I was hit by how lucky I am. With you Rey, even being lost feels like the right place.',
    date: '2026-10-06T20:30:00.000Z',
    mood: 'loved',
    location: 'Country Road Route 9',
    photos: ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80'],
    musicTrack: 'Holocene - Bon Iver',
    isFavorite: true,
    partnerRead: true,
    reactions: [{ emoji: '🥹', userId: 'user_2' }, { emoji: '❤️', userId: 'user_2' }]
  },
  {
    id: 'jnl_2',
    authorId: 'user_2',
    title: 'The quiet beauty of ordinary Sundays',
    content: 'The aroma of dark roast beans in the kitchen. The slow rustle of turning book pages. The cat sleeping between our feet on the duvet. We didnt accomplish anything grand today, yet today was complete perfection. My soul feels so at peace whenever we are together Desh.',
    date: '2026-10-01T11:00:00.000Z',
    mood: 'peaceful',
    location: 'Our Living Room',
    isFavorite: true,
    partnerRead: true,
    reactions: [{ emoji: '❤️', userId: 'user_1' }]
  }
];

export const initialLetters: LoveLetter[] = [
  {
    id: 'let_1',
    authorId: 'user_1',
    authorName: 'Desh',
    recipientId: 'user_2',
    recipientName: 'Rey',
    occasion: "Open when you're missing me",
    title: 'Close your eyes and breathe',
    content: `My dearest Rey,

If you are opening this letter right now, it means there is distance between us, or the hours are feeling a little too quiet.

I want you to pause, put your hand over your heart, and remember this: from the moment we started talking on September 24 to when we became us on September 27, you became my forever sanctuary. Not a single mile can diminish what we share.

Take a deep breath. I am loving you from wherever I am, every second of every minute. I will be right back in your arms before you know it.

Forever yours,
Desh`,
    isOpened: false,
    waxSealColor: 'monochrome-silver',
    createdAt: '2026-09-28T12:00:00.000Z'
  },
  {
    id: 'let_2',
    authorId: 'user_2',
    authorName: 'Rey',
    recipientId: 'user_1',
    recipientName: 'Desh',
    occasion: "Open when you need motivation",
    title: 'You are capable of everything you dream',
    content: `My love Desh,

Whatever mountain you are facing today, remember who you are. I see the tireless dedication, the quiet courage, and the massive heart you pour into everything you touch.

Do not let doubt whisper in your ear. Take one step at a time. I believe in you with every fiber of my being, and I will always be in your corner celebrating your victories and holding your hand through the climb.

Go conquer today. I am so proud of you!

With all my love,
Rey`,
    isOpened: true,
    openedAt: '2026-10-02T08:30:00.000Z',
    waxSealColor: 'monochrome-black',
    createdAt: '2026-09-29T10:00:00.000Z'
  },
  {
    id: 'let_3',
    authorId: 'user_1',
    authorName: 'Desh',
    recipientId: 'user_2',
    recipientName: 'Rey',
    occasion: "Open on our anniversary",
    title: 'To another year of choosing you',
    content: `Happy Anniversary, my soulmate Rey.

Looking back at September 27 when our journey began, my heart overflows with gratitude. Thank you for your warmth, your goofy humor, your patient understanding, and your unconditional love.

May our future hold ten thousand more sunsets, quiet mornings, and boundless adventures.

I love you more today than yesterday, and less than tomorrow.

Yours forever,
Desh`,
    isOpened: false,
    unlockDate: '2027-09-27T00:00:00.000Z',
    waxSealColor: 'clay-dark',
    createdAt: '2026-09-27T00:00:00.000Z'
  },
  {
    id: 'let_4',
    authorId: 'user_2',
    authorName: 'Rey',
    recipientId: 'user_1',
    recipientName: 'Desh',
    occasion: "Open when you need a smile",
    title: 'Top 5 reasons why you are adorable',
    content: `1. The way your nose scrunches when you concentrate on cooking.
2. How you talk to animals as if they are your long-lost colleagues.
3. Your terrible dad jokes that I secretly find hilarious.
4. The sleepy bed-hair look in the morning.
5. How tightly you pull me in when you fall asleep.

Smile right now Desh! Because you are adored beyond measure :)`,
    isOpened: false,
    waxSealColor: 'monochrome-white',
    createdAt: '2026-10-01T15:00:00.000Z'
  }
];

export const initialMilestones: Milestone[] = [
  {
    id: 'mls_1',
    date: '2026-09-24T16:00:00.000Z',
    title: 'September 24 — Our First Conversation',
    description: 'The day we started talking. What began with a simple message turned into talking for hours without noticing time passing at all.',
    location: 'Where it all started',
    photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80'],
    category: 'firsts',
    highlightQuote: 'We started talking about our favorite things and ended up realizing we found our person.'
  },
  {
    id: 'mls_2',
    date: '2026-09-27T00:00:00.000Z',
    title: 'September 27 — Our Official Beginning',
    description: 'The day we promised each other our hearts and officially made it Desh & Rey. The beginning of our private sanctuary.',
    location: 'Rosewood Garden Terrace',
    photos: ['https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80'],
    category: 'anniversaries',
    song: { title: 'Mystery of Love', artist: 'Sufjan Stevens' },
    highlightQuote: 'I never believed in destiny until I met you, Rey.'
  },
  {
    id: 'mls_3',
    date: '2026-10-02T12:00:00.000Z',
    title: 'Our First Mountain Valley Getaway',
    description: 'Driving through scenic switchbacks, watching the morning mists glide across the pines, and sharing hot chai.',
    location: 'Pahalgam & Gulmarg, Kashmir',
    photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80'],
    category: 'trips',
    highlightQuote: 'Cold noses and warm hands.'
  },
  {
    id: 'mls_4',
    date: '2026-10-05T14:30:00.000Z',
    title: 'Building Our Private Digital Home',
    description: 'Creating this private digital sanctuary where our memories, chats, and love notes are preserved forever.',
    location: 'Our Space',
    photos: ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80'],
    category: 'life',
    highlightQuote: 'Our own private little internet.'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    type: 'message_reaction',
    title: 'Rey reacted ❤️ to your message',
    description: '"Look at the sky tonight! The moon is glowing so bright..."',
    timestamp: '2026-10-08T21:10:00.000Z',
    isRead: false,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    linkUrl: '/chat',
    actionText: 'View in Chat'
  },
  {
    id: 'notif_2',
    type: 'memory_added',
    title: 'Rey saved a new memory',
    description: 'The Night of September 27 — Our Beginning was added to Special Moments.',
    timestamp: '2026-10-08T18:30:00.000Z',
    isRead: false,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    linkUrl: '/memories',
    actionText: 'Open Vault'
  },
  {
    id: 'notif_3',
    type: 'song_added',
    title: 'Rey added a new track to Our Music',
    description: 'About You - The 1975 was saved to Her Favorites.',
    timestamp: '2026-10-07T14:15:00.000Z',
    isRead: true,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    linkUrl: '/music',
    actionText: 'Listen Now'
  },
  {
    id: 'notif_4',
    type: 'letter_written',
    title: 'New Love Letter Waiting For You 💌',
    description: 'Open when you need a smile is sealed with silver wax.',
    timestamp: '2026-10-05T09:00:00.000Z',
    isRead: true,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    linkUrl: '/letters',
    actionText: 'Unseal Letter'
  }
];

export const initialReels: Reel[] = [
  {
    id: 'reel-01',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/DeOofwmCelo/?exln=ZmI1dzJkNzV1YTkw',
    shortcode: 'DeOofwmCelo',
    title: 'Our Warm Romantic Escape',
    caption: 'Every time I look at this, I remember how lucky I am to have you by my side.',
    category: 'romantic',
    isFavorite: true,
    savedAt: '2026-10-01T12:00:00.000Z',
  },
  {
    id: 'reel-02',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/DeO_zatp5mM/?mdxt=MW11ZjV0cDhjb2NjYw==',
    shortcode: 'DeO_zatp5mM',
    title: 'Endless Whispers & Soft Smiles',
    caption: 'No words needed when we look into each other\'s eyes.',
    category: 'romantic',
    isFavorite: false,
    savedAt: '2026-10-02T13:00:00.000Z',
  },
  {
    id: 'reel-03',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/DcnsoD0xr72/?xtok=bG85cnFvM2dzNHl0',
    shortcode: 'DcnsoD0xr72',
    title: 'Just You & Me',
    caption: 'Building our quiet sanctuary in a noisy world.',
    category: 'romantic',
    isFavorite: true,
    savedAt: '2026-10-03T14:00:00.000Z',
  },
  {
    id: 'reel-04',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/Dc6RjCnTMtE/?vrfl=MWs5aWo5bTRoM2tlag==',
    shortcode: 'Dc6RjCnTMtE',
    title: 'Holding Hands Under The Stars',
    caption: 'Never want to let your hand go, Rey.',
    category: 'romantic',
    isFavorite: false,
    savedAt: '2026-10-04T15:00:00.000Z',
  },
  {
    id: 'reel-05',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/DeE-k49yPII/?xtok=MWc3azIzMjcyOTdkeg==',
    shortcode: 'DeE-k49yPII',
    title: 'Synchronized Hearts',
    caption: 'A lovely reminder of how we complete each other\'s sentences.',
    category: 'romantic',
    isFavorite: false,
    savedAt: '2026-10-05T16:00:00.000Z',
  },
  {
    id: 'reel-06',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/DeAb9ItINQa/?rpxt=MTNrdzhuNWt0c2l0eA==',
    shortcode: 'DeAb9ItINQa',
    title: 'Cozy Morning Hugs',
    caption: 'The best place to be in the whole world.',
    category: 'romantic',
    isFavorite: true,
    savedAt: '2026-10-06T17:00:00.000Z',
  },
  {
    id: 'post-07',
    platform: 'instagram',
    url: 'https://www.instagram.com/p/Ddg7Xbntr62/?dlrf=MW9qaXozZ2gwaGJlNA==',
    shortcode: 'Ddg7Xbntr62',
    title: 'Timeless Memory Post',
    caption: 'A precious memory we fell in love with.',
    category: 'memories',
    isFavorite: false,
    savedAt: '2026-10-07T18:00:00.000Z',
  },
  {
    id: 'reel-08',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/Dd57GY5P14V/?mdxt=MXdmMng5dW13dWtnaw==',
    shortcode: 'Dd57GY5P14V',
    title: 'Soft Sweet Melody',
    caption: 'Reminds me of our late night calls.',
    category: 'romantic',
    isFavorite: false,
    savedAt: '2026-10-08T19:00:00.000Z',
  },
  {
    id: 'reel-09',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/DeGuPGrSS_C/?exln=MTlvb2w5ZGM1MWh6Yw==',
    shortcode: 'DeGuPGrSS_C',
    title: 'Pure Serenity',
    caption: 'Your smile brings peace to my soul.',
    category: 'romantic',
    isFavorite: false,
    savedAt: '2026-10-08T20:00:00.000Z',
  },
  {
    id: 'reel-10',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/DeCYen2PIQH/?mdxt=MTY1ZmdjajdzNXd5aA==',
    shortcode: 'DeCYen2PIQH',
    title: 'Warmth in Winter Nights',
    caption: 'Can’t wait to wrap up together with coffee and cozy blankets.',
    category: 'romantic',
    isFavorite: true,
    savedAt: '2026-10-09T10:00:00.000Z',
  },
  {
    id: 'reel-11',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/Da46yQVTNPs/?psln=MWljNmZ5cGIxaXkzMQ==',
    shortcode: 'Da46yQVTNPs',
    title: 'Forever Kind of Love',
    caption: 'Thank you for choosing me every single day.',
    category: 'romantic',
    isFavorite: false,
    savedAt: '2026-10-09T14:00:00.000Z',
  },
  {
    id: 'reel-12',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/DeErjaTJGv2/?rpxt=MWtqOGt5ODRoNDExcw==',
    shortcode: 'DeErjaTJGv2',
    title: 'Gentle Moments of Us',
    caption: 'A little reminder of why we fell in love.',
    category: 'romantic',
    isFavorite: false,
    savedAt: '2026-10-09T18:00:00.000Z',
  },
  {
    id: 'reel-13',
    platform: 'instagram',
    url: 'https://www.instagram.com/reel/DcrAa67K0Fk/?srtk=YXd0bXcxcTRjdHI5',
    shortcode: 'DcrAa67K0Fk',
    title: 'Our Golden Chapter',
    caption: 'Written in our hearts forever and always.',
    category: 'romantic',
    isFavorite: true,
    savedAt: '2026-10-09T21:00:00.000Z',
  },
];
