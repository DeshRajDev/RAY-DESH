import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Couple } from '../../models/Couple';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// GET current couple sanctuary data
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const couple = await Couple.findById(req.couple!.id).populate('partner1 partner2');
    if (!couple) {
      return sendError(res, 'Couple sanctuary not found', 404);
    }
    return sendSuccess(res, couple.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch couple';
    return sendError(res, msg, 500);
  }
});

// PATCH couple settings
router.patch('/settings', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allowedFields = [
      'anniversaryDate',
      'relationshipStartDate',
      'theme',
      'customTitle',
      'coupleAvatar',
      'soundEnabled',
      'privacyPinEnabled',
    ];

    const body = (req as AuthenticatedRequest).body || {};
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    const updated = await Couple.findByIdAndUpdate(req.couple!.id, updates, { new: true }).populate('partner1 partner2');
    return sendSuccess(res, updated?.toJSON(), 'Couple sanctuary settings updated');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update couple settings';
    return sendError(res, msg, 500);
  }
});

export const coupleRoutes = router;
