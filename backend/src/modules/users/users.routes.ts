import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { User } from '../../models/User';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// Helper to extract string partner ID safely from couple
function getPartnerId(couple: any, myUserId: string): string {
  const p1 = (couple.partner1Id?._id || couple.partner1Id || couple.partner1?._id || couple.partner1 || '').toString();
  const p2 = (couple.partner2Id?._id || couple.partner2Id || couple.partner2?._id || couple.partner2 || '').toString();
  return p1 === myUserId ? p2 : p1;
}

// GET partner profile
router.get('/partner', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = getPartnerId(req.couple!, req.user!.id);
    const partner = await User.findById(partnerId);
    if (!partner) {
      return sendError(res, 'Partner not found', 404);
    }
    const partnerJson = partner.toJSON();
    if (partnerJson.role === 'partner2' && (partnerJson.name === 'Desh' || partnerJson.name === 'Rey' || !partnerJson.name)) {
      partnerJson.name = 'Ray';
    } else if (partnerJson.role === 'partner1' && (partnerJson.name === 'Ray' || partnerJson.name === 'Rey' || !partnerJson.name)) {
      partnerJson.name = 'Desh';
    }
    return sendSuccess(res, partnerJson);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch partner';
    return sendError(res, msg, 500);
  }
});

// GET both profiles (current user and partner) with real avatars
router.get('/profiles', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = getPartnerId(req.couple!, req.user!.id);
    const [me, partner] = await Promise.all([
      User.findById(req.user!.id),
      User.findById(partnerId),
    ]);

    const meJson = me?.toJSON();
    const partnerJson = partner?.toJSON();
    
    if (meJson) {
      if (meJson.role === 'partner2' && (meJson.name === 'Desh' || meJson.name === 'Rey' || !meJson.name)) {
        meJson.name = 'Ray';
      } else if (meJson.role === 'partner1' && (meJson.name === 'Ray' || meJson.name === 'Rey' || !meJson.name)) {
        meJson.name = 'Desh';
      }
    }

    if (partnerJson) {
      if (partnerJson.role === 'partner2' && (partnerJson.name === 'Desh' || partnerJson.name === 'Rey' || !partnerJson.name)) {
        partnerJson.name = 'Ray';
      } else if (partnerJson.role === 'partner1' && (partnerJson.name === 'Ray' || partnerJson.name === 'Rey' || !partnerJson.name)) {
        partnerJson.name = 'Desh';
      }
    }

    return sendSuccess(res, {
      me: meJson,
      partner: partnerJson,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch profiles';
    return sendError(res, msg, 500);
  }
});

// GET partner presence (real online status & accurate lastSeenAt)
router.get('/presence', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = getPartnerId(req.couple!, req.user!.id);
    const partner = await User.findById(partnerId).select('isOnline lastSeenAt lastSeen updatedAt name role');
    if (!partner) return sendError(res, 'Partner not found', 404);

    return sendSuccess(res, {
      userId: partnerId,
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

    if (req.user!.role === 'partner2' && (updates.name === 'Desh' || updates.name === 'Rey')) {
      updates.name = 'Ray';
    } else if (req.user!.role === 'partner1' && (updates.name === 'Ray' || updates.name === 'Rey')) {
      updates.name = 'Desh';
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
