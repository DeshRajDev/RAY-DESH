import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { User } from '../../models/User';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// GET partner profile
router.get('/partner', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const couple = req.couple!;
    const partnerId = couple.partner1Id.toString() === req.user!.id
      ? couple.partner2Id
      : couple.partner1Id;

    const partner = await User.findById(partnerId);
    if (!partner) {
      return sendError(res, 'Partner not found', 404);
    }
    return sendSuccess(res, partner.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch partner';
    return sendError(res, msg, 500);
  }
});

// GET both profiles (current user and partner) with real avatars
router.get('/profiles', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const couple = req.couple!;
    const partnerId = couple.partner1Id.toString() === req.user!.id
      ? couple.partner2Id
      : couple.partner1Id;

    const [me, partner] = await Promise.all([
      User.findById(req.user!.id),
      User.findById(partnerId),
    ]);

    return sendSuccess(res, {
      me: me?.toJSON(),
      partner: partner?.toJSON(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch profiles';
    return sendError(res, msg, 500);
  }
});

// GET partner presence (real online status & accurate lastSeenAt)
router.get('/presence', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const couple = req.couple!;
    const partnerId = couple.partner1Id.toString() === req.user!.id
      ? couple.partner2Id
      : couple.partner1Id;

    const partner = await User.findById(partnerId).select('isOnline lastSeenAt lastSeen updatedAt name role');
    if (!partner) return sendError(res, 'Partner not found', 404);

    return sendSuccess(res, {
      userId: partnerId.toString(),
      isOnline: Boolean(partner.isOnline),
      lastSeenAt: (partner as any).lastSeenAt || partner.updatedAt,
      lastSeen: partner.lastSeen || (partner.isOnline ? 'Online now' : 'Recently active'),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch presence';
    return sendError(res, msg, 500);
  }
});

// PATCH current user profile
router.patch('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allowedUpdates = [
      'name',
      'nickname',
      'avatar',
      'bio',
      'birthday',
      'favoriteSong',
      'favoritePlace',
      'favoriteQuote',
      'favoriteColor',
      'statusMessage',
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updated = await User.findByIdAndUpdate(req.user!.id, updates, { new: true });

    // Broadcast updated profile to couple room so partner sees avatar update immediately
    if (updated && updated.coupleId) {
      const { getSocketIo } = require('../../sockets');
      const io = getSocketIo();
      if (io) {
        io.to(`couple:${updated.coupleId}`).emit('user:profile_updated', {
          userId: updated._id.toString(),
          role: updated.role,
          avatar: updated.avatar,
          name: updated.name,
          nickname: updated.nickname,
          bio: updated.bio,
          statusMessage: updated.statusMessage,
        });
      }
    }

    return sendSuccess(res, updated?.toJSON(), 'Profile updated successfully');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update profile';
    return sendError(res, msg, 500);
  }
});

export const userRoutes = router;
