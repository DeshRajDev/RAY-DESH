import { User, ApiResponse } from '@/types';
import { currentUser, partnerUser } from '@/constants/initial-data';
import { ApiClient } from './api/client';

export interface AuthCredentials {
  identifier: string; // Phone number or Email
  password: string;
  remember?: boolean;
}

export const ACCOUNTS = {
  desh: {
    id: 'user_1',
    mongoId: '6ad5228158634ec577ea3c5c',
    email: 'desh@couple.local',
    phoneNumber: '8580962780',
    username: 'desh',
    name: 'Desh',
    role: 'partner1' as const,
    defaultPassword: 'Love..',
    birthday: '2004-05-15T00:00:00.000Z',
  },
  ray: {
    id: 'user_2',
    mongoId: '6ad5228158634ec577ea3c61',
    email: 'ray@couple.local',
    phoneNumber: '9015006850',
    username: 'ray',
    name: 'Ray',
    role: 'partner2' as const,
    defaultPassword: 'Love..',
    birthday: '2005-11-01T00:00:00.000Z',
  },
  rey: {
    id: 'user_2',
    mongoId: '6ad5228158634ec577ea3c61',
    email: 'ray@couple.local',
    phoneNumber: '9015006850',
    username: 'ray',
    name: 'Ray',
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
        const token = localStorage.getItem('auth_token') || localStorage.getItem('couple_auth_token');
        if (sessionActive === 'true' || !!token) {
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
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('couple_auth_token');
      if (token) return true;
    }
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
    try {
      const api = ApiClient.getInstance();
      const res = await api.post<{ success: boolean; data: { accessToken: string; refreshToken?: string; user: any; couple: any }; message?: string }>('/auth/login', {
        identifier: identifier.trim(),
        password: password || '',
      });

      if (!res || !res.data || !res.data.accessToken) {
        throw new Error(res?.message || 'Login failed from backend');
      }

      const { accessToken, user: backendUser, couple: backendCouple } = res.data;
      api.setToken(accessToken);

      this.isSessionActive = true;
      const mappedRole = backendUser.role === 'partner1' ? 'user_1' : 'user_2';
      const partnerRole = mappedRole === 'user_1' ? 'user_2' : 'user_1';
      this.activeUserId = mappedRole;

      // Update in-memory current user
      const userObj = this.mapBackendUser(backendUser, mappedRole);
      this.users[mappedRole] = userObj;

      // Also synchronize partner profile from backend profiles endpoint
      try {
        const profRes = await api.get<{ success: boolean; data: { me: any; partner: any } }>('/users/profiles');
        if (profRes && profRes.success && profRes.data) {
          const { me: pMe, partner: pPartner } = profRes.data;
          if (pMe) this.users[mappedRole] = this.mapBackendUser(pMe, mappedRole);
          if (pPartner) this.users[partnerRole] = this.mapBackendUser(pPartner, partnerRole);
        }
      } catch {
        // fallback
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, 'true');
        localStorage.setItem(STORAGE_KEY, mappedRole);
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(this.users));
        if (backendCouple) {
          const partner1Id = (backendCouple.partner1?.id || backendCouple.partner1 || (backendCouple.partner1 as any)?._id || '').toString();
          const partner2Id = (backendCouple.partner2?.id || backendCouple.partner2 || (backendCouple.partner2 as any)?._id || '').toString();
          localStorage.setItem('sanctuary_couple_settings_v2', JSON.stringify({
            id: backendCouple.id || backendCouple._id,
            _id: backendCouple.id || backendCouple._id,
            partner1Id,
            partner2Id,
            partner1: mappedRole === 'user_1' ? this.users.user_1 : this.users.user_2,
            partner2: mappedRole === 'user_2' ? this.users.user_2 : this.users.user_1,
            anniversaryDate: backendCouple.anniversaryDate,
            relationshipStartDate: backendCouple.relationshipStartDate,
            customTitle: backendCouple.customTitle || 'Ray',
            theme: backendCouple.theme || 'dark',
            coupleAvatar: backendCouple.coupleAvatar,
            soundEnabled: backendCouple.soundEnabled ?? true,
            privacyPinEnabled: backendCouple.privacyPinEnabled ?? false,
          }));
        }
      }

      this.notify();
      return { success: true, data: this.users[mappedRole] };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid phone number/email or password.';
      return {
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: msg,
        },
      };
    }
  }

  private mapBackendUser(raw: any, roleKey: 'user_1' | 'user_2'): User {
    const defaultAvatar = roleKey === 'user_1' ? currentUser.avatar : partnerUser.avatar;
    let name = raw.name || (roleKey === 'user_1' ? 'Desh' : 'Ray');
    if (roleKey === 'user_2' && (name === 'Desh' || name === 'Rey')) name = 'Ray';
    if (roleKey === 'user_1' && (name === 'Ray' || name === 'Rey')) name = 'Desh';

    const fallbackMongoId = roleKey === 'user_1' ? '6ad5228158634ec577ea3c5c' : '6ad5228158634ec577ea3c61';
    const mongoId = String(raw.id || raw._id || fallbackMongoId).trim();

    return {
      id: roleKey,
      _id: mongoId,
      mongoId,
      name,
      nickname: raw.nickname || '',
      email: raw.email,
      phoneNumber: raw.phoneNumber,
      avatar: raw.avatar || defaultAvatar,
      bio: raw.bio || '',
      birthday: raw.birthday || (roleKey === 'user_1' ? '2004-05-15T00:00:00.000Z' : '2005-11-01T00:00:00.000Z'),
      favoriteSong: raw.favoriteSong,
      favoritePlace: raw.favoritePlace,
      favoriteQuote: raw.favoriteQuote,
      favoriteColor: raw.favoriteColor,
      statusMessage: raw.statusMessage,
      isOnline: Boolean(raw.isOnline),
      role: raw.role || (roleKey === 'user_1' ? 'partner1' : 'partner2'),
    };
  }

  public async verifySession(): Promise<boolean> {
    const api = ApiClient.getInstance();
    const token = api.getToken();
    if (!token) {
      this.isSessionActive = false;
      return false;
    }

    try {
      const [meRes, profilesRes] = await Promise.all([
        api.get<{ success: boolean; data: { user: any; couple: any } }>('/auth/me'),
        api.get<{ success: boolean; data: { me: any; partner: any } }>('/users/profiles').catch(() => null),
      ]);

      if (meRes && meRes.success && meRes.data?.user) {
        const backendUser = meRes.data.user;
        const mappedRole = backendUser.role === 'partner1' ? 'user_1' : 'user_2';
        const partnerRole = mappedRole === 'user_1' ? 'user_2' : 'user_1';
        this.activeUserId = mappedRole;
        this.isSessionActive = true;

        this.users[mappedRole] = this.mapBackendUser(backendUser, mappedRole);

        if (profilesRes && profilesRes.success && profilesRes.data) {
          const { me: pMe, partner: pPartner } = profilesRes.data;
          if (pMe) this.users[mappedRole] = this.mapBackendUser(pMe, mappedRole);
          if (pPartner) this.users[partnerRole] = this.mapBackendUser(pPartner, partnerRole);
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_KEY, 'true');
          localStorage.setItem(STORAGE_KEY, mappedRole);
          localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(this.users));
        }

        this.notify();
        return true;
      }
    } catch (err: any) {
      // ONLY logout if server explicitly rejected the token with 401 Unauthorized
      // Never logout on network hiccups, render cold-starts, offline mode, or timeouts!
      if (err && (err.status === 401 || err.statusCode === 401)) {
        this.logout();
        return false;
      }
      // Keep existing authenticated session active during transient network drops
      console.warn('[AuthService] verifySession failed transiently, preserving local session:', err?.message);
      return this.isSessionActive;
    }
    return this.isSessionActive;
  }

  public async ensureToken(): Promise<string | null> {
    const api = ApiClient.getInstance();
    let token = api.getToken();
    if (token) return token;

    try {
      const activeAccount = this.activeUserId === 'user_2' ? ACCOUNTS.ray : ACCOUNTS.desh;
      const res = await this.loginWithCredentials(activeAccount.phoneNumber, activeAccount.defaultPassword);
      if (res.success) {
        return api.getToken();
      }
    } catch {
      // ignore
    }
    return api.getToken();
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
    // Strictly isolate updates to the current authenticated user!
    const key = this.activeUserId as 'user_1' | 'user_2';
    this.users[key] = { ...this.users[key], ...updates };
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(this.users));
    }
    try {
      const res = await ApiClient.getInstance().patch<{ success: boolean; data: any }>('/users/profile', updates);
      if (res && res.data) {
        this.users[key] = this.mapBackendUser(res.data, key);
        if (typeof window !== 'undefined') {
          localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(this.users));
        }
      }
    } catch (err) {
      console.warn('Profile update backend sync error:', err);
    }
    this.notify();
    return this.users[key];
  }

  public logout(): void {
    try {
      ApiClient.getInstance().post('/auth/logout').catch(() => {});
    } catch {
      // ignore
    }
    this.isSessionActive = false;
    this.activeUserId = 'user_1';
    // Reset in-memory users back to defaults so no data leaks between accounts
    this.users = {
      user_1: { ...currentUser },
      user_2: { ...partnerUser },
    };
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PROFILES_STORAGE_KEY);
      localStorage.removeItem('sanctuary_couple_settings_v2');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('couple_auth_token');
      try {
        ApiClient.getInstance().setToken(null);
      } catch {
        // ignore
      }
    }

    try {
      const { chatService } = require('./chat.service');
      if (chatService && typeof chatService.disconnectSocket === 'function') {
        chatService.disconnectSocket();
      }
    } catch {
      // ignore
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
