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
    logger.info('🌱 Seeding database for Desh & Rey sanctuary...');

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
      favoriteSong: 'Mystery of Love - Sufjan Stevens',
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
      favoriteSong: 'About You - The 1975',
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
      customTitle: 'Desh & Rey — Our Sanctuary',
      coupleAvatar: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
      soundEnabled: true,
      privacyPinEnabled: false,
    });

    desh.coupleId = couple._id;
    rey.coupleId = couple._id;
    await desh.save();
    await rey.save();

    // 3. Messages
    await Message.create([
      {
        coupleId: couple._id,
        senderId: rey._id,
        receiverId: desh._id,
        content: 'Look at the sky tonight! The moon is glowing so bright right above our balcony.',
        type: 'text',
        reactions: [{ emoji: '❤️', userId: desh._id, timestamp: '2026-10-08T21:10:00.000Z' }],
        isRead: true,
        isDelivered: true,
      },
      {
        coupleId: couple._id,
        senderId: desh._id,
        receiverId: rey._id,
        content: 'Just stepped out to look. Absolutely breathtaking... reminds me of when we first started talking on Sep 24.',
        type: 'text',
        reactions: [{ emoji: '🥹', userId: rey._id, timestamp: '2026-10-08T21:12:00.000Z' }],
        isRead: true,
        isDelivered: true,
      },
    ]);

    // 4. Date Events
    await DateEvent.create([
      {
        coupleId: couple._id,
        title: 'Our Anniversary (Sep 27)',
        date: '2026-09-27T00:00:00.000Z',
        type: 'Anniversary',
        description: 'The beautiful day we officially started our journey together as Desh & Rey.',
        location: 'Rosewood Garden',
        isRecurringYearly: true,
        remindDaysBefore: [30, 7, 1],
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
        title: "Desh's Birthday 🎉",
        date: '2004-05-15T00:00:00.000Z',
        type: 'Birthday',
        description: "Celebrating Desh's special day with favorite homemade ramen and gaming marathon.",
        location: 'Our Apartment',
        isRecurringYearly: true,
        remindDaysBefore: [30, 7, 1],
      },
    ]);

    // 5. Birthday Plans & Wishes
    await Birthday.create({
      coupleId: couple._id,
      plans: [
        {
          id: 'bplan_1',
          title: 'Vintage Leatherbound Travel Journal with Custom Embossed Monogram',
          category: 'Gift Idea',
          status: 'purchased',
          budget: '$85',
          secret: true,
          notes: 'Hidden in the top left wardrobe compartment under winter coats.',
          addedById: desh._id,
        },
      ],
      wishes: [
        {
          id: 'bwish_1',
          forUserId: rey._id,
          title: 'FujiFilm Instax Wide 300 Instant Camera',
          description: 'To capture more retro wide film prints for our memory wall!',
          price: '$130',
          photoUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
          isClaimed: true,
        },
        {
          id: 'bwish_2',
          forUserId: rey._id,
          title: 'Artisanal Ceramic Matcha Bowl & Whisk Set',
          description: 'Handcrafted pottery for peaceful morning teas.',
          price: '$45',
          photoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
          isClaimed: false,
        },
        {
          id: 'bwish_3',
          forUserId: desh._id,
          title: 'Mechanical Keychron Custom Keyboard',
          description: 'Tactile quiet keys for late night coding and writing love notes.',
          price: '$110',
          photoUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
          isClaimed: false,
        },
      ],
      specialMessageForPartner: 'To my favorite person in the universe: Happy Birthday, Rey ❤️',
      specialMessageFromPartner: 'Thank you Desh for making every day magical.',
    });

    // 5b. Indian Couple Bucket List
    await BucketList.create([
      {
        coupleId: couple._id,
        title: 'Visit Prem Mandir & Watch the Evening Musical Light Show in Vrindavan',
        description: 'Walking hand in hand through the glowing white Italian marble temple with Radha Krishna bhajans playing softly.',
        category: 'Romantic',
        priority: 'dream',
        isCompleted: false,
        dateAdded: new Date('2026-09-25T00:00:00.000Z'),
        location: 'Prem Mandir, Vrindavan, Uttar Pradesh',
        addedById: desh._id,
      },
      {
        coupleId: couple._id,
        title: 'Trek Together to Sacred Kamrunag Temple & Lake in the Misty Hills',
        description: 'Peaceful hike through quiet deodar pine forests to the mystical Himalayan lake and offering our heartfelt prayers for our future.',
        category: 'Adventure',
        priority: 'high',
        isCompleted: false,
        dateAdded: new Date('2026-09-26T00:00:00.000Z'),
        location: 'Kamrunag Lake, Mandi, Himachal Pradesh',
        photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80'],
        addedById: rey._id,
      },
      {
        coupleId: couple._id,
        title: 'Experience Snowfall & Cozy Cafe Nights in Old Manali & Solang Valley',
        description: 'Sitting beside a wood-fired cafe oven, drinking hot chocolate, and waking up to fresh white snow outside our balcony.',
        category: 'Travel',
        priority: 'high',
        isCompleted: true,
        dateAdded: new Date('2026-09-27T00:00:00.000Z'),
        completedDate: new Date('2026-10-04T18:30:00.000Z'),
        location: 'Old Manali, Himachal Pradesh',
        photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'],
        notes: 'The Beas river sound and hot momos in the cold air were pure magic!',
        addedById: desh._id,
      },
      {
        coupleId: couple._id,
        title: 'Evening Walk on Shimla Mall Road & The Ridge in Winter Fog',
        description: 'Wearing cozy sweaters, holding hands on the Mall Road, taking photos near the iconic Christ Church with misty mountain views.',
        category: 'Romantic',
        priority: 'high',
        isCompleted: false,
        dateAdded: new Date('2026-09-28T00:00:00.000Z'),
        location: 'The Ridge & Mall Road, Shimla',
        addedById: rey._id,
      },
      {
        coupleId: couple._id,
        title: 'Sunset Shikara Ride on Dal Lake & Night Stay in a Wooden Houseboat',
        description: 'Gliding across lotus waters with Pir Panjal snow peaks reflected, sipping authentic saffron kahwa.',
        category: 'Romantic',
        priority: 'dream',
        isCompleted: true,
        dateAdded: new Date('2026-09-29T00:00:00.000Z'),
        completedDate: new Date('2026-10-06T18:00:00.000Z'),
        location: 'Dal Lake, Srinagar, Kashmir',
        photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'],
        addedById: desh._id,
      },
      {
        coupleId: couple._id,
        title: 'Candlelight Dinner by Lake Pichola with City Palace Lights in Udaipur',
        description: 'A rooftop dinner over the water watching the royal palaces glow under the night sky.',
        category: 'Romantic',
        priority: 'high',
        isCompleted: false,
        dateAdded: new Date('2026-10-01T00:00:00.000Z'),
        location: 'Lake Pichola, Udaipur, Rajasthan',
        addedById: rey._id,
      },
    ]);

    // 5c. Indian Places
    await Place.create([
      {
        coupleId: couple._id,
        name: 'Prem Mandir',
        city: 'Vrindavan, Mathura',
        country: 'India',
        category: 'WantToGo',
        photos: ['https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80'],
        notes: 'Divine white marble temple with beautiful evening light show and serene gardens.',
        isFavorite: true,
        rating: 5,
        addedById: desh._id,
      },
      {
        coupleId: couple._id,
        name: 'Kamrunag Temple & Lake',
        city: 'Mandi, Himachal Pradesh',
        country: 'India',
        category: 'WantToGo',
        photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80'],
        notes: 'Hidden mystical lake amidst high mountain pine forests. Perfect quiet trek for us.',
        isFavorite: true,
        rating: 5,
        addedById: rey._id,
      },
      {
        coupleId: couple._id,
        name: 'The Ridge & Mall Road',
        city: 'Shimla, Himachal Pradesh',
        country: 'India',
        category: 'Been',
        photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'],
        notes: 'Romantic foggy evening walks, historic Christ church, and hot street coffee.',
        dateVisited: new Date('2026-10-03T00:00:00.000Z'),
        isFavorite: true,
        rating: 5,
        addedById: desh._id,
      },
      {
        coupleId: couple._id,
        name: 'Old Manali River Cafe',
        city: 'Manali, Himachal Pradesh',
        country: 'India',
        category: 'Been',
        photos: ['https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80'],
        notes: 'Sitting next to the flowing Beas river listening to acoustic music together.',
        dateVisited: new Date('2026-10-05T00:00:00.000Z'),
        isFavorite: true,
        rating: 5,
        addedById: rey._id,
      },
    ]);
    await Milestone.create([
      {
        coupleId: couple._id,
        date: '2026-09-24T16:00:00.000Z',
        title: 'September 24 — Our First Conversation',
        description: 'The day we started talking. What began with a simple message turned into talking for hours.',
        location: 'Where it all started',
        photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80'],
        category: 'firsts',
        highlightQuote: 'We started talking about our favorite things and ended up realizing we found our person.',
      },
      {
        coupleId: couple._id,
        date: '2026-09-27T00:00:00.000Z',
        title: 'September 27 — Our Official Beginning',
        description: 'The day we promised each other our hearts and officially made it Desh & Rey.',
        location: 'Rosewood Garden Terrace',
        photos: ['https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80'],
        category: 'anniversaries',
        song: { title: 'Mystery of Love', artist: 'Sufjan Stevens' },
        highlightQuote: 'I never believed in destiny until I met you, Rey.',
      },
    ]);

    // 7. Seed Our Reels Gallery
    await Reel.create([
      {
        coupleId: couple._id,
        createdBy: desh._id,
        createdByName: 'Desh',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/DeOofwmCelo/?exln=ZmI1dzJkNzV1YTkw',
        shortcode: 'DeOofwmCelo',
        title: 'Our Warm Romantic Escape',
        caption: 'Every time I look at this, I remember how lucky I am to have you by my side.',
        category: 'romantic',
        isFavorite: true,
        savedAt: new Date('2026-10-01T12:00:00.000Z'),
      },
      {
        coupleId: couple._id,
        createdBy: rey._id,
        createdByName: 'Rey',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/DeO_zatp5mM/?mdxt=MW11ZjV0cDhjb2NjYw==',
        shortcode: 'DeO_zatp5mM',
        title: 'Endless Whispers & Soft Smiles',
        caption: 'No words needed when we look into each other\'s eyes.',
        category: 'romantic',
        isFavorite: false,
        savedAt: new Date('2026-10-02T13:00:00.000Z'),
      },
      {
        coupleId: couple._id,
        createdBy: desh._id,
        createdByName: 'Desh',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/DcnsoD0xr72/?xtok=bG85cnFvM2dzNHl0',
        shortcode: 'DcnsoD0xr72',
        title: 'Just You & Me',
        caption: 'Building our quiet sanctuary in a noisy world.',
        category: 'romantic',
        isFavorite: true,
        savedAt: new Date('2026-10-03T14:00:00.000Z'),
      },
      {
        coupleId: couple._id,
        createdBy: rey._id,
        createdByName: 'Rey',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/Dc6RjCnTMtE/?vrfl=MWs5aWo5bTRoM2tlag==',
        shortcode: 'Dc6RjCnTMtE',
        title: 'Holding Hands Under The Stars',
        caption: 'Never want to let your hand go, Rey.',
        category: 'romantic',
        isFavorite: false,
        savedAt: new Date('2026-10-04T15:00:00.000Z'),
      },
      {
        coupleId: couple._id,
        createdBy: desh._id,
        createdByName: 'Desh',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/DeE-k49yPII/?xtok=MWc3azIzMjcyOTdkeg==',
        shortcode: 'DeE-k49yPII',
        title: 'Synchronized Hearts',
        caption: 'A lovely reminder of how we complete each other\'s sentences.',
        category: 'romantic',
        isFavorite: false,
        savedAt: new Date('2026-10-05T16:00:00.000Z'),
      },
      {
        coupleId: couple._id,
        createdBy: rey._id,
        createdByName: 'Rey',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/DeAb9ItINQa/?rpxt=MTNrdzhuNWt0c2l0eA==',
        shortcode: 'DeAb9ItINQa',
        title: 'Cozy Morning Hugs',
        caption: 'The best place to be in the whole world.',
        category: 'romantic',
        isFavorite: true,
        savedAt: new Date('2026-10-06T17:00:00.000Z'),
      },
      {
        coupleId: couple._id,
        createdBy: desh._id,
        createdByName: 'Desh',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/p/Ddg7Xbntr62/?dlrf=MW9qaXozZ2gwaGJlNA==',
        shortcode: 'Ddg7Xbntr62',
        title: 'Timeless Memory Post',
        caption: 'A precious memory we fell in love with.',
        category: 'memories',
        isFavorite: false,
        savedAt: new Date('2026-10-07T18:00:00.000Z'),
      },
      {
        coupleId: couple._id,
        createdBy: rey._id,
        createdByName: 'Rey',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/Dd57GY5P14V/?mdxt=MXdmMng5dW13dWtnaw==',
        shortcode: 'Dd57GY5P14V',
        title: 'Soft Sweet Melody',
        caption: 'Reminds me of our late night calls.',
        category: 'romantic',
        isFavorite: false,
        savedAt: new Date('2026-10-08T19:00:00.000Z'),
      },
      {
        coupleId: couple._id,
        createdBy: desh._id,
        createdByName: 'Desh',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/DeGuPGrSS_C/?exln=MTlvb2w5ZGM1MWh6Yw==',
        shortcode: 'DeGuPGrSS_C',
        title: 'Pure Serenity',
        caption: 'Your smile brings peace to my soul.',
        category: 'romantic',
        isFavorite: false,
        savedAt: new Date('2026-10-08T20:00:00.000Z'),
      },
      {
        coupleId: couple._id,
        createdBy: rey._id,
        createdByName: 'Rey',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/DeCYen2PIQH/?mdxt=MTY1ZmdjajdzNXd5aA==',
        shortcode: 'DeCYen2PIQH',
        title: 'Warmth in Winter Nights',
        caption: 'Can’t wait to wrap up together with coffee and cozy blankets.',
        category: 'romantic',
        isFavorite: true,
        savedAt: new Date('2026-10-09T10:00:00.000Z'),
      },
      {
        coupleId: couple._id,
        createdBy: desh._id,
        createdByName: 'Desh',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/Da46yQVTNPs/?psln=MWljNmZ5cGIxaXkzMQ==',
        shortcode: 'Da46yQVTNPs',
        title: 'Forever Kind of Love',
        caption: 'Thank you for choosing me every single day.',
        category: 'romantic',
        isFavorite: false,
        savedAt: new Date('2026-10-09T14:00:00.000Z'),
      },
      {
        coupleId: couple._id,
        createdBy: rey._id,
        createdByName: 'Rey',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/DeErjaTJGv2/?rpxt=MWtqOGt5ODRoNDExcw==',
        shortcode: 'DeErjaTJGv2',
        title: 'Gentle Moments of Us',
        caption: 'A little reminder of why we fell in love.',
        category: 'romantic',
        isFavorite: false,
        savedAt: new Date('2026-10-09T18:00:00.000Z'),
      },
      {
        coupleId: couple._id,
        createdBy: desh._id,
        createdByName: 'Desh',
        platform: 'instagram',
        sourceUrl: 'https://www.instagram.com/reel/DcrAa67K0Fk/?srtk=YXd0bXcxcTRjdHI5',
        shortcode: 'DcrAa67K0Fk',
        title: 'Our Golden Chapter',
        caption: 'Written in our hearts forever and always.',
        category: 'romantic',
        isFavorite: true,
        savedAt: new Date('2026-10-09T21:00:00.000Z'),
      },
    ]);

    logger.info('✅ Seeding complete! Desh & Rey sanctuary successfully initialized.');
    await disconnectDatabase();
  } catch (err) {
    logger.error({ err }, 'Seeding error');
    process.exit(1);
  }
}

seed();
