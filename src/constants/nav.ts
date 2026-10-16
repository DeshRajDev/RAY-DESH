export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string | number;
  category?: 'main' | 'memories' | 'plans' | 'personal';
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { title: 'Home', href: '/dashboard', iconName: 'Home', category: 'main' },
  { title: 'Chat', href: '/chat', iconName: 'MessageCircle', category: 'main' },
  { title: 'Our Feed', href: '/posts', iconName: 'Flame', category: 'main' },
  { title: 'Our Stories', href: '/stories', iconName: 'Sparkles', category: 'main' },
  { title: 'Our Memories', href: '/memories', iconName: 'Camera', category: 'memories' },
  { title: 'Our Reels', href: '/reels', iconName: 'Film', category: 'memories' },
  { title: 'Favorites', href: '/favorites', iconName: 'Bookmark', category: 'memories' },
  { title: 'Our Music', href: '/music', iconName: 'Music', category: 'memories' },
  { title: 'Important Dates', href: '/dates', iconName: 'CalendarHeart', category: 'plans' },
  { title: 'Birthday', href: '/birthday', iconName: 'Cake', category: 'plans' },
  { title: 'Our Bucket List', href: '/bucket-list', iconName: 'CheckSquare', category: 'plans' },
  { title: 'Our Trips', href: '/trips', iconName: 'Compass', category: 'plans' },
  { title: 'Our Places', href: '/places', iconName: 'MapPin', category: 'plans' },
  { title: 'Our Journal', href: '/journal', iconName: 'BookHeart', category: 'personal' },
  { title: 'Letters & Notes', href: '/letters', iconName: 'Mail', category: 'personal' },
  { title: 'Our Story Timeline', href: '/timeline', iconName: 'History', category: 'personal' },
  { title: 'Profile', href: '/profile', iconName: 'User', category: 'personal' },
  { title: 'Settings', href: '/settings', iconName: 'Settings', category: 'personal' },
];

export const MOBILE_PRIMARY_NAV = [
  { title: 'Home', href: '/dashboard', iconName: 'Home' },
  { title: 'Chat', href: '/chat', iconName: 'MessageCircle' },
  { title: 'Memories', href: '/memories', iconName: 'Camera' },
  { title: 'Stories', href: '/stories', iconName: 'Sparkles' },
  { title: 'More', href: '#more', iconName: 'Grid' },
];
