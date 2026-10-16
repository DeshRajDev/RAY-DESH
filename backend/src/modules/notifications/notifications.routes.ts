import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Notification } from '../../models/Notification';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET notifications for recipient
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await Notification.find({
      coupleId: req.couple!.id,
      recipientId: req.user!.id,
    }).sort({ createdAt: -1 });

    return sendSuccess(res, notifications.map((n: any) => n.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch notifications';
    return sendError(res, msg, 500);
  }
});

// POST mark single notification as read
router.post('/:id/read', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user!.id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return sendError(res, 'Notification not found', 404);
    return sendSuccess(res, notif.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to mark notification read';
    return sendError(res, msg, 500);
  }
});

// POST mark all as read
router.post('/mark-all-read', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { coupleId: req.couple!.id, recipientId: req.user!.id, isRead: false },
      { isRead: true }
    );
    return sendSuccess(res, { marked: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to mark notifications read';
    return sendError(res, msg, 500);
  }
});

export const notificationRoutes = router;
