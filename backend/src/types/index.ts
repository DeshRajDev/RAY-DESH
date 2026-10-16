import { Request } from 'express';
import { Types } from 'mongoose';

export type ID = string;

export interface TokenPayload {
  userId: string;
  coupleId?: string;
  role: 'partner1' | 'partner2';
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  _id: Types.ObjectId;
  name: string;
  nickname: string;
  email: string;
  avatar: string;
  bio: string;
  birthday: string;
  favoriteSong?: string;
  favoritePlace?: string;
  favoriteQuote?: string;
  favoriteColor?: string;
  statusMessage?: string;
  isOnline: boolean;
  role: 'partner1' | 'partner2';
}

export interface AuthenticatedCouple {
  id: string;
  _id: Types.ObjectId;
  partner1Id: Types.ObjectId;
  partner2Id: Types.ObjectId;
  anniversaryDate: string;
  relationshipStartDate: string;
  theme: 'dark' | 'light' | 'system';
  customTitle: string;
  coupleAvatar?: string;
  soundEnabled: boolean;
  privacyPinEnabled: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  couple?: AuthenticatedCouple;
  requestId?: string;
  body: any;
  params: any;
  query: any;
  file?: any;
  files?: any;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    details?: unknown;
  };
  requestId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
