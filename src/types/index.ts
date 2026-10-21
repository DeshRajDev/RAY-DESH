export type ID = string;

export interface User {
  id: ID;
  name: string;
  nickname: string;
  email?: string;
  phoneNumber?: string;
  avatar: string;
  bio: string;
  birthday: string; // ISO string
  favoriteSong?: string;
  favoritePlace?: string;
  favoriteQuote?: string;
  favoriteColor?: string;
  statusMessage?: string;
  isOnline: boolean;
  lastSeen?: string;
  role: 'partner1' | 'partner2';
}

export interface Couple {
  id: ID;
  partner1: User;
  partner2: User;
  anniversaryDate: string; // ISO string
  relationshipStartDate: string; // ISO string
  theme: 'dark' | 'light' | 'system';
  customTitle: string;
  coupleAvatar?: string;
  soundEnabled: boolean;
  privacyPinEnabled: boolean;
}

export interface MessageReaction {
  emoji: string;
  userId: ID;
  timestamp: string;
}

export interface MessageAttachment {
  id: ID;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name?: string;
  size?: string;
  duration?: number;
}

export interface Message {
  id: ID;
  senderId: ID;
  receiverId: ID;
  content: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'sticker';
  attachments?: MessageAttachment[];
  reactions: MessageReaction[];
  replyToId?: ID;
  replyToContent?: string;
  replyToSenderName?: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  isRead: boolean;
  isDelivered: boolean;
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Story {
  id: ID;
  authorId: ID;
  type: 'image' | 'video' | 'text' | 'music';
  mediaUrl?: string;
  text?: string;
  textColor?: string;
  backgroundColor?: string;
  songTitle?: string;
  songArtist?: string;
  caption?: string;
  stickers?: string[];
  mentions?: string[];
  createdAt: string;
  expiresAt: string;
  reactions: { emoji: string; userId: ID }[];
  replies: { id: ID; userId: ID; text: string; createdAt: string }[];
  isArchived?: boolean;
}

export type MemoryCategory = 'All' | 'Photos' | 'Videos' | 'Screenshots' | 'Trips' | 'Dates' | 'Birthdays' | 'Special Moments';

export interface Memory {
  id: ID;
  title: string;
  description: string;
  date: string; // ISO string
  location?: string;
  category: MemoryCategory;
  mediaUrls: string[];
  coverUrl: string;
  tags: string[];
  isFavorite: boolean;
  addedById: ID;
  likes: number;
  commentsCount: number;
  createdAt: string;
}

export type ReelPlatform = 'instagram' | 'facebook';

export type ReelCategory = 'All' | 'romantic' | 'memories' | 'favorites' | 'recently_added' | string;

export interface Reel {
  id: ID;
  coupleId?: ID;
  createdBy?: ID;
  createdByName?: string;
  platform: ReelPlatform;
  url: string; // original source URL including query params
  shortcode?: string;
  title?: string;
  caption?: string;
  category: string;
  isFavorite?: boolean;
  savedAt: string; // ISO string
  createdAt?: string;
  updatedAt?: string;
}

export interface PostComment {
  id: ID;
  userId: ID;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: ID;
  authorId: ID;
  authorName: string;
  authorAvatar: string;
  type: 'photo' | 'video' | 'text' | 'memory' | 'music';
  content?: string;
  mediaUrls: string[];
  song?: {
    title: string;
    artist: string;
    coverUrl?: string;
  };
  location?: string;
  date: string;
  likes: ID[];
  reactions: { emoji: string; userId: ID }[];
  comments: PostComment[];
  isPinned?: boolean;
  createdAt: string;
}

export interface Song {
  id: ID;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl?: string;
  addedById: ID;
  addedByName: string;
  dateAdded: string;
  isFavorite: boolean;
  category: 'Our Songs' | 'Her Favorites' | 'My Favorites' | 'Recently Added' | 'Most Played';
  lyricsSnippet?: string;
  note?: string;
  provider?: string;
  providerTrackId?: string;
  licenseUrl?: string;
  shareUrl?: string;
}

export interface JamendoTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  shareUrl: string;
  licenseUrl?: string;
  downloadAllowed: boolean;
}

export type DateEventType = 
  | 'Anniversary' 
  | 'Birthday' 
  | 'First Meeting' 
  | 'First Date' 
  | 'First Message' 
  | 'Special Moment' 
  | 'Trip' 
  | 'Custom';

export interface DateEvent {
  id: ID;
  title: string;
  date: string; // ISO string
  type: DateEventType;
  description?: string;
  location?: string;
  isRecurringYearly: boolean;
  photos?: string[];
  notes?: string;
  remindDaysBefore?: number[];
  icon?: string;
}

export interface BirthdayPlan {
  id: ID;
  forUserId?: ID;
  title: string;
  category: 'Gift Idea' | 'Surprise' | 'Place to Visit' | 'Activity' | 'Message/Card';
  status: 'idea' | 'planned' | 'purchased' | 'completed';
  notes?: string;
  photos?: string[];
  budget?: string;
  secret: boolean; // secret from partner
  addedById: ID;
  createdAt?: string;
}

export interface BirthdayGiftWish {
  id: ID;
  forUserId: ID;
  addedById?: ID;
  title: string;
  description: string;
  link?: string;
  price?: string;
  photoUrl?: string;
  videoUrl?: string; // Links of items in video format (Instagram Reel, TikTok, MP4)
  isClaimed?: boolean;
  createdAt?: string;
}

export interface BirthdayData {
  partnerBirthday: string; // ISO string
  myBirthday: string;
  partnerName: string;
  plans: BirthdayPlan[];
  wishes: BirthdayGiftWish[];
  specialMessageForPartner: string;
  specialMessageFromPartner: string;
}

export type BucketListCategory = 
  | 'Travel' 
  | 'Food' 
  | 'Experiences' 
  | 'Adventure' 
  | 'Romantic' 
  | 'Personal Goals' 
  | 'Future' 
  | 'Crazy Ideas';

export type BucketListPriority = 'low' | 'medium' | 'high' | 'dream';

export interface BucketListItem {
  id: ID;
  title: string;
  description?: string;
  category: BucketListCategory;
  priority: BucketListPriority;
  isCompleted: boolean;
  dateAdded: string;
  completedDate?: string;
  location?: string;
  targetDate?: string;
  photos?: string[];
  notes?: string;
  addedById: ID;
}

export interface TripLocation {
  id: ID;
  name: string;
  date?: string;
  notes?: string;
  coordinates?: { lat: number; lng: number };
  photos?: string[];
}

export interface TripExpense {
  id: ID;
  title: string;
  amount: number;
  currency: string;
  paidById: ID;
  category: string;
  date: string;
}

export interface Trip {
  id: ID;
  title: string;
  destination: string;
  country?: string;
  startDate: string;
  endDate: string;
  coverPhoto?: string;
  coverUrl?: string;
  locations?: TripLocation[];
  photos?: string[];
  videos?: string[];
  notes?: string;
  status: 'planning' | 'ongoing' | 'completed' | 'planned';
  expenses?: TripExpense[];
  highlightMemoryId?: ID;
  itinerary?: any[];
  packingList?: any[];
  memoriesCount?: number;
  createdAt: string;
}

export interface Place {
  id: ID;
  name: string;
  city: string;
  country: string;
  category: 'Been' | 'WantToGo';
  coordinates?: { lat: number; lng: number };
  photos: string[];
  notes?: string;
  dateVisited?: string;
  visitedDate?: string;
  isFavorite: boolean;
  rating?: number;
  addedById?: ID;
}

export type JournalMood = 'joyful' | 'loved' | 'peaceful' | 'thoughtful' | 'nostalgic' | 'silly' | 'grateful' | 'excited';

export interface JournalEntry {
  id: ID;
  authorId: ID;
  authorName?: string;
  title: string;
  content: string;
  date: string;
  mood: JournalMood | string;
  weather?: string;
  location?: string;
  photos?: string[];
  isPrivate?: boolean;
  musicTrack?: string;
  isFavorite?: boolean;
  partnerRead?: boolean;
  reactions?: { emoji: string; userId: ID }[];
}

export type LetterOccasion = 
  | "Open when you're missing me"
  | "Open when you're sad"
  | "Open when you need motivation"
  | "Open on our anniversary"
  | "Open on your birthday"
  | "Open when you need a smile"
  | "Open when you can't sleep"
  | "Open on a rainy day"
  | "Open just because";

export interface LoveLetter {
  id: ID;
  authorId: ID;
  authorName: string;
  recipientId: ID;
  recipientName: string;
  occasion: LetterOccasion;
  title: string;
  content: string;
  isOpened: boolean;
  openedAt?: string;
  unlockDate?: string; // if locked until date
  photos?: string[];
  audioVoiceNoteUrl?: string;
  waxSealColor?: 'monochrome-silver' | 'monochrome-black' | 'monochrome-white' | 'clay-dark';
  createdAt: string;
}

export interface Milestone {
  id: ID;
  date: string;
  title: string;
  description: string;
  location?: string;
  photos: string[];
  category: 'firsts' | 'trips' | 'anniversaries' | 'life' | 'commitments';
  song?: {
    title: string;
    artist: string;
  };
  highlightQuote?: string;
}

export type NotificationType = 
  | 'message_reaction'
  | 'memory_added'
  | 'song_added'
  | 'place_added'
  | 'birthday_soon'
  | 'date_soon'
  | 'letter_written'
  | 'bucket_completed'
  | 'story_added'
  | 'post_reaction';

export interface NotificationItem {
  id: ID;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  avatar?: string;
  linkUrl?: string;
  actionText?: string;
}

// API Response envelopes for future backend compatibility
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code?: string;
    message?: string;
  } | string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
