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

// PATCH current user profile
router.patch('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allowedUpdates = [
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
    return sendSuccess(res, updated?.toJSON(), 'Profile updated successfully');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update profile';
    return sendError(res, msg, 500);
  }
});

export const userRoutes = router;
