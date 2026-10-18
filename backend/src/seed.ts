/// <reference path="../../declarations.d.ts" />
/// <reference path="../declarations.d.ts" />
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './config/database';
import { User } from './models/User';
import { Couple } from './models/Couple';
import { Message } from './models/Message';
import { Story } from './models/Story';
import { Post } from './models/Post';
import { Memory } from './models/Memory';
import { Song } from './models/Song';
import { DateEvent } from './models/DateEvent';
import { Birthday } from './models/Birthday';
import { BucketList } from './models/BucketList';
import { Trip } from './models/Trip';
import { Place } from './models/Place';
import { Journal } from './models/Journal';
import { LoveLetter } from './models/LoveLetter';
import { Milestone } from './models/Milestone';
import { Notification } from './models/Notification';
import { Reel } from './models/Reel';
import { hashPassword } from './utils/password';
import { logger } from './utils/logger';

async function seed() {
  try {
    await connectDatabase();
    logger.info('🌱 Seeding database for Ray — किरण sanctuary...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Couple.deleteMany({}),
      Message.deleteMany({}),
      Story.deleteMany({}),
      Post.deleteMany({}),
      Memory.deleteMany({}),
      Song.deleteMany({}),
      DateEvent.deleteMany({}),
      Birthday.deleteMany({}),
      BucketList.deleteMany({}),
      Trip.deleteMany({}),
      Place.deleteMany({}),
      Journal.deleteMany({}),
      LoveLetter.deleteMany({}),
      Milestone.deleteMany({}),
      Notification.deleteMany({}),
      Reel.deleteMany({}),
    ]);

    const defaultPasswordHash = await hashPassword('Love..');

    // 1. Create Partners
    const desh = await User.create({
      name: 'Desh',
      nickname: 'My Love',
      email: 'desh@couple.local',
      phoneNumber: '8580962780',
      passwordHash: defaultPasswordHash,
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
    });

    const rey = await User.create({
      name: 'Rey',
      nickname: 'My Queen',
      email: 'rey@couple.local',
      phoneNumber: '9015006850',
      passwordHash: defaultPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      bio: 'Coffee lover, stargazing enthusiast, and your biggest cheerleader ✨',
      birthday: '2005-11-01T00:00:00.000Z',
      favoriteSong: 'Love Note',
      favoritePlace: 'Old Town Cobblestone Lane, Prague',
      favoriteQuote: 'You are my sun, my moon, and all my stars.',
      favoriteColor: '#2A2A2A',
      statusMessage: 'Curled up reading with a warm cappuccino ☕',
      isOnline: true,
      role: 'partner2',
    });

    // 2. Create Couple Sanctuary
    const couple = await Couple.create({
      partner1: desh._id,
      partner2: rey._id,
      anniversaryDate: '2026-09-27T00:00:00.000Z',
      relationshipStartDate: '2026-09-27T00:00:00.000Z',
      theme: 'dark',
      customTitle: 'Ray — किरण',
      coupleAvatar: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
      soundEnabled: true,
      privacyPinEnabled: false,
    });

    desh.coupleId = couple._id;
    rey.coupleId = couple._id;
    await desh.save();
    await rey.save();

    // 3. Welcome Message (1 entry)
    await Message.create([
      {
        coupleId: couple._id,
        senderId: rey._id,
        receiverId: desh._id,
        content: 'Welcome to Ray — किरण, our private sanctuary ❤️ Forever starts right here.',
        type: 'text',
        reactions: [{ emoji: '❤️', userId: desh._id, timestamp: '2026-09-27T12:00:00.000Z' }],
        isRead: true,
        isDelivered: true,
      },
    ]);

    // 4. Important Dates (Anniversary, First Talk, Birthdays)
    await DateEvent.create([
      {
        coupleId: couple._id,
        title: 'Our Anniversary (Sep 27)',
        date: '2026-09-27T00:00:00.000Z',
        type: 'Anniversary',
        description: 'The beautiful day we officially started our journey together.',
        location: 'Our Sacred Space',
        isRecurringYearly: true,
        remindDaysBefore: [30, 7, 1],
      },
      {
        coupleId: couple._id,
        title: 'First Conversation (Sep 24)',
        date: '2026-09-24T16:00:00.000Z',
        type: 'First Message',
        description: 'The unforgettable day we started talking.',
        location: 'Our First Hello',
        isRecurringYearly: true,
        remindDaysBefore: [7, 1],
      },
      {
        coupleId: couple._id,
        title: "Rey's Birthday 🎂",
        date: '2005-11-01T00:00:00.000Z',
        type: 'Birthday',
        description: 'Celebrating the birth of the most radiant soul in my world, Rey.',
        location: 'Home & Secret Getaway',
        isRecurringYearly: true,
        remindDaysBefore: [60, 30, 14, 7, 1],
      },
      {
        coupleId: couple._id,
        title: "Desh's Birthday 🎉",
        date: '2004-05-15T00:00:00.000Z',
        type: 'Birthday',
        description: "Celebrating Desh's special day.",
        remindDaysBefore: [30, 7, 1],
      },
    ]);

    // 5. Birthday Hub (1 entry)
    await Birthday.create({
      coupleId: couple._id,
      plans: [
        {
          id: 'bplan_1',
          forUserId: rey._id,
          title: 'Special Birthday Surprise Celebration',
          category: 'Surprise',
          status: 'planned',
          budget: 'Priceless',
          secret: true,
          notes: 'Special dinner and heartfelt letter exchange.',
          addedById: desh._id,
        },
      ],
      wishes: [
        {
          id: 'bwish_1',
          forUserId: rey._id,
          title: 'Instant Camera & Memory Album',
          description: 'To print wide photos for our memory wall.',
          price: 'Gift',
          photoUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
          isClaimed: false,
        },
      ],
      specialMessageForPartner: 'Happy Birthday to my favorite person in the universe ❤️',
      specialMessageFromPartner: 'Thank you for making every day magical.',
    });

    // 6. Bucket List (1 entry)
    await BucketList.create([
      {
        coupleId: couple._id,
        title: 'Visit Prem Mandir in Vrindavan Together',
        description: 'Walking hand in hand through the glowing white Italian marble temple.',
        category: 'Romantic',
        priority: 'dream',
        isCompleted: false,
        dateAdded: '2026-09-27',
        location: 'Prem Mandir, Vrindavan, Uttar Pradesh',
        addedById: desh._id,
      },
    ]);

    // 7. Memory (1 entry)
    await Memory.create([
      {
        coupleId: couple._id,
        title: 'The Beginning of Ray — किरण',
        description: 'The official beginning of our private sanctuary under the autumn stars.',
        date: '2026-09-27',
        location: 'Private Sanctuary',
        category: 'Special Moments',
        mediaUrls: ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80'],
        coverUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80',
        tags: ['Anniversary', 'Sep 27', 'Beginning'],
        isFavorite: true,
        likes: 1,
        addedById: desh._id,
      },
    ]);

    // 8. Story (1 entry)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await Story.create([
      {
        coupleId: couple._id,
        authorId: rey._id,
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80',
        caption: 'Our digital home is live ✨',
        expiresAt: tomorrow,
        reactions: [{ emoji: '❤️', userId: desh._id }],
        isArchived: false,
      },
    ]);

    // 9. Post (1 entry)
    await Post.create([
      {
        coupleId: couple._id,
        authorId: desh._id,
        caption: 'Welcome to Ray — किरण. A private space made exclusively for us.',
        mediaUrls: ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80'],
        likes: [{ userId: rey._id, emoji: '❤️' }],
        comments: [],
      },
    ]);

    // 10. Songs (Rey's Favorite 1st & Desh's Favorite 2nd)
    await Song.create([
      {
        coupleId: couple._id,
        title: 'Love Note',
        artist: 'Rey',
        album: 'Sanctuary Melodies',
        duration: 148,
        coverUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
        audioUrl: '/songs/Love%20Note.mp3',
        addedById: rey._id,
        addedByName: 'Rey',
        category: 'Her Favorites',
        lyricsSnippet: 'A tender melody made for the quiet hours with you...',
        note: "Rey's favorite song ❤️",
        isFavorite: true,
        playCount: 12,
      },
      {
        coupleId: couple._id,
        title: 'Samjhawan',
        artist: 'Arijit Singh & Shreya Ghoshal',
        album: 'Humpty Sharma Ki Dulhania',
        duration: 270,
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        audioUrl: '/songs/Samjhawan%20Humpty%20Sharma%20Ki%20Dulhania%20320%20Kbps.mp3',
        addedById: desh._id,
        addedByName: 'Desh',
        category: 'My Favorites',
        lyricsSnippet: 'Main tenu samjhawan ki / Na tere bina lagda jee...',
        note: "Desh's favorite song ❤️",
        isFavorite: true,
        playCount: 15,
      },
    ]);

    // 11. Place (1 entry)
    await Place.create([
      {
        coupleId: couple._id,
        name: 'Prem Mandir',
        city: 'Vrindavan',
        country: 'India',
        category: 'want_to_go',
        photos: ['https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80'],
        notes: 'Our dream visit to the temple of pure divine love.',
        isFavorite: true,
        rating: 5,
        addedById: desh._id,
      },
    ]);

    // 12. Trip (1 entry)
    await Trip.create([
      {
        coupleId: couple._id,
        title: 'Himachal Misty Hill Getaway',
        destination: 'Manali & Kasol, Himachal Pradesh',
        startDate: '2026-11-10',
        endDate: '2026-11-15',
        coverUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
        status: 'planned',
        itinerary: [
          {
            id: 'itin_1',
            day: 1,
            date: '2026-11-10',
            activity: 'Arrival, warm chai by the stream, attic check-in',
            location: 'Old Manali',
            isDone: false,
          },
        ],
        locations: [
          {
            id: 'loc_1',
            name: 'Old Manali Attic',
            lat: 32.253,
            lng: 77.175,
            highlight: 'Cozy wooden loft with river views',
          },
        ],
        packingList: [
          {
            id: 'pack_1',
            item: 'Warm woolen mufflers & beanies',
            isPacked: true,
            packedByUserId: desh._id,
          },
        ],
        memoriesCount: 0,
        notes: 'Pack comfortable trekking boots.',
      },
    ]);

    // 13. Journal (1 entry)
    await Journal.create([
      {
        coupleId: couple._id,
        authorId: desh._id,
        authorName: 'Desh',
        date: '2026-09-27',
        title: 'The Starlight Promise',
        content: 'From the day we started talking on September 24 to our official beginning on September 27, every conversation with you feels like home.',
        mood: 'grateful',
        photos: ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80'],
        isPrivate: false,
        isFavorite: true,
        partnerRead: true,
        reactions: [{ emoji: '❤️', userId: rey._id }],
      },
    ]);

    // 14. Love Letter (1 entry)
    await LoveLetter.create([
      {
        coupleId: couple._id,
        authorId: desh._id,
        authorName: 'Desh',
        recipientId: rey._id,
        recipientName: 'Rey',
        occasion: 'Open on our anniversary',
        title: 'To My Radiant Ray',
        content: 'In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine. Welcome to our sanctuary.',
        isOpened: true,
        openedAt: new Date().toISOString(),
        waxSealColor: 'monochrome-black',
        photos: ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80'],
      },
    ]);

    // 15. Milestone (1 entry)
    await Milestone.create([
      {
        coupleId: couple._id,
        title: 'Officially Us',
        date: '2026-09-27',
        category: 'commitments',
        description: 'The day we promised each other our hearts. The beginning of Ray — किरण.',
        highlightQuote: 'In all the world, there is no heart for me like yours.',
        photos: ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80'],
        song: {
          title: 'Mystery of Love',
          artist: 'Sufjan Stevens',
        },
      },
    ]);

    // 16. Notification (1 entry)
    await Notification.create([
      {
        coupleId: couple._id,
        recipientId: desh._id,
        type: 'date_soon',
        title: 'Welcome to Ray — किरण',
        description: 'Your private sanctuary is live and connected.',
        isRead: false,
        linkUrl: '/dashboard',
        actionText: 'Enter Sanctuary',
      },
      {
        coupleId: couple._id,
        recipientId: rey._id,
        type: 'date_soon',
        title: 'Welcome to Ray — किरण',
        description: 'Your private sanctuary is live and connected.',
        isRead: false,
        linkUrl: '/dashboard',
        actionText: 'Enter Sanctuary',
      },
    ]);

    // 17. Reel (1 entry)
    await Reel.create([
      {
        coupleId: couple._id,
        createdBy: rey._id,
        createdByName: 'Rey',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/C3x9abcd123/',
        shortcode: 'C3x9abcd123',
        title: 'Golden Hour Reflections',
        caption: 'Walking into golden hour with you ✨',
        category: 'romantic',
        isFavorite: true,
      },
    ]);

    logger.info('🎉 Ray — किरण database seeded successfully with users, dates, and clean starter entries!');
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, '❌ Error seeding database');
    await disconnectDatabase();
    process.exit(1);
  }
}

seed();
