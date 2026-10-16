import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { Couple } from '../models/Couple';
import { AuthenticatedRequest } from '../types';
import { sendError } from '../utils/response';

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 2. Check cookies
    if (!token && req.cookies && req.cookies.couple_access_token) {
      token = req.cookies.couple_access_token;
    }

    if (!token) {
      sendError(res, 'Authentication required. Please log in.', 401, 'UNAUTHORIZED', undefined, req.requestId);
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload || !payload.userId) {
      sendError(res, 'Invalid or expired access token.', 401, 'INVALID_TOKEN', undefined, req.requestId);
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      sendError(res, 'User associated with token not found.', 401, 'USER_NOT_FOUND', undefined, req.requestId);
      return;
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      birthday: user.birthday,
      favoriteSong: user.favoriteSong,
      favoritePlace: user.favoritePlace,
      favoriteQuote: user.favoriteQuote,
      favoriteColor: user.favoriteColor,
      statusMessage: user.statusMessage,
      isOnline: user.isOnline,
      role: user.role,
    };

    // Load couple context if present
    if (user.coupleId) {
      const couple = await Couple.findById(user.coupleId);
      if (couple) {
        req.couple = {
          id: couple._id.toString(),
          _id: couple._id,
          partner1Id: couple.partner1,
          partner2Id: couple.partner2,
          anniversaryDate: couple.anniversaryDate,
          relationshipStartDate: couple.relationshipStartDate,
          theme: couple.theme,
          customTitle: couple.customTitle,
          coupleAvatar: couple.coupleAvatar,
          soundEnabled: couple.soundEnabled,
          privacyPinEnabled: couple.privacyPinEnabled,
        };
      }
    }

    next();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid token';
    sendError(res, `Authentication failed: ${msg}`, 401, 'AUTH_FAILED', undefined, req.requestId);
  }
}
