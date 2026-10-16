import { User, ApiResponse } from '@/types';
import { currentUser, partnerUser } from '@/constants/initial-data';

export interface AuthCredentials {
  identifier: string; // Phone number or Email
  password: string;
  remember?: boolean;
}

export const ACCOUNTS = {
  desh: {
    id: 'user_1',
    email: 'desh@couple.local',
    phoneNumber: '8580962780',
    username: 'desh',
    name: 'Desh',
    role: 'partner1' as const,
    defaultPassword: 'Love..',
    birthday: '2004-05-15T00:00:00.000Z',
  },
  rey: {
    id: 'user_2',
    email: 'rey@couple.local',
    phoneNumber: '9015006850',
    username: 'rey',
    name: 'Rey',
    role: 'partner2' as const,
    defaultPassword: 'Love..',
    birthday: '2005-11-01T00:00:00.000Z',
  },
};

const SESSION_KEY = 'sanctuary_session_active_v2';
const STORAGE_KEY = 'sanctuary_active_user_id_v2';
const PROFILES_STORAGE_KEY = 'sanctuary_users_data_v2';

class AuthService {
  private isSessionActive: boolean = false;
  private activeUserId: string = 'user_1';
  private users: { user_1: User; user_2: User };
  private listeners: ((userId: string) => void)[] = [];

  constructor() {
    this.users = {
      user_1: { ...currentUser },
      user_2: { ...partnerUser },
    };

    if (typeof window !== 'undefined') {
      try {
        const sessionActive = localStorage.getItem(SESSION_KEY);
        if (sessionActive === 'true') {
          this.isSessionActive = true;
        }

        const savedId = localStorage.getItem(STORAGE_KEY);
        if (savedId && (savedId === 'user_1' || savedId === 'user_2')) {
          this.activeUserId = savedId;
        }

        const savedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
        if (savedProfiles) {
          const parsed = JSON.parse(savedProfiles);
          if (parsed.user_1) this.users.user_1 = { ...this.users.user_1, ...parsed.user_1 };
          if (parsed.user_2) this.users.user_2 = { ...this.users.user_2, ...parsed.user_2 };
        }
      } catch {
        // Fallback to memory
      }
    }
  }

  public isAuthenticated(): boolean {
    return this.isSessionActive;
  }

  public getActiveUserId(): string {
    return this.activeUserId;
  }

  public getCurrentUser(): User {
    return this.users[this.activeUserId as 'user_1' | 'user_2'] || this.users.user_1;
  }

  public getPartnerUser(): User {
    const partnerId = this.activeUserId === 'user_1' ? 'user_2' : 'user_1';
    return this.users[partnerId as 'user_1' | 'user_2'] || this.users.user_2;
  }

  public getAllUsers(): { me: User; partner: User } {
    return {
      me: this.getCurrentUser(),
      partner: this.getPartnerUser(),
    };
  }

  public identifyAccount(identifier: string): 'desh' | 'rey' | null {
    const cleaned = identifier.trim().toLowerCase().replace(/[^a-z0-9@.]/g, '');
    const rawDigits = identifier.replace(/\D/g, '');

    if (
      rawDigits === '8580962780' ||
      rawDigits.endsWith('8580962780') ||
      cleaned === 'desh' ||
      cleaned === 'desh@couple.local' ||
      cleaned.includes('desh')
    ) {
      return 'desh';
    }

    if (
      rawDigits === '9015006850' ||
      rawDigits.endsWith('9015006850') ||
      cleaned === 'rey' ||
      cleaned === 'ray' ||
      cleaned === 'rey@couple.local' ||
      cleaned === 'ray@couple.local' ||
      cleaned.includes('rey') ||
      cleaned.includes('ray')
    ) {
      return 'rey';
    }

    return null;
  }

  public async loginWithCredentials(identifier: string, password?: string): Promise<ApiResponse<User>> {
    if (!password || password.trim() !== 'Love..') {
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect password. Please enter the valid sanctuary password.',
        },
      };
    }

    const account = this.identifyAccount(identifier);
    if (!account) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Unrecognized phone number or email. Please enter Desh (8580962780) or Rey (9015006850).',
        },
      };
    }

    const targetUserId = ACCOUNTS[account].id;
    this.activeUserId = targetUserId;
    this.isSessionActive = true;

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, targetUserId);
    }

    this.notify();
    return { success: true, data: this.getCurrentUser() };
  }

  public async switchUser(userId: 'user_1' | 'user_2'): Promise<User> {
    this.activeUserId = userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, userId);
    }
    this.notify();
    return this.getCurrentUser();
  }

  public async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const key = userId as 'user_1' | 'user_2';
    if (this.users[key]) {
      this.users[key] = { ...this.users[key], ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(this.users));
      }
      this.notify();
      return this.users[key];
    }
    return this.getCurrentUser();
  }

  public logout(): void {
    this.isSessionActive = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
    this.notify();
  }

  public subscribe(listener: (userId: string) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.activeUserId));
  }
}

export const authService = new AuthService();
