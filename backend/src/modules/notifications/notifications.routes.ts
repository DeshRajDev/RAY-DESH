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

// GET VAPID public key
router.get('/vapid-public-key', (_req: any, res: Response) => {
  const { env } = require('../../config/env');
  const publicKey = env.VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return sendError(
      res,
      'Web Push VAPID public key is not configured on this server. Please set VAPID_PUBLIC_KEY in your environment.',
      503
    );
  }
  return sendSuccess(res, { publicKey });
});

// POST save push subscription
router.post('/push-subscription', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return sendError(res, 'Invalid subscription payload', 400);
    }

    const { PushSubscription } = require('../../models/PushSubscription');
    const sub = await PushSubscription.findOneAndUpdate(
      { userId: req.user!.id, endpoint },
      {
        userId: req.user!.id,
        coupleId: req.couple!.id,
        endpoint,
        keys,
        userAgent: req.headers['user-agent'] || '',
      },
      { upsert: true, new: true }
    );

    return sendSuccess(res, { subscribed: true, id: sub._id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save push subscription';
    return sendError(res, msg, 500);
  }
});

// DELETE remove push subscription
router.delete('/push-subscription', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { endpoint } = req.body;
    const { PushSubscription } = require('../../models/PushSubscription');
    await PushSubscription.deleteMany({ userId: req.user!.id, ...(endpoint ? { endpoint } : {}) });
    return sendSuccess(res, { unsubscribed: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to remove push subscription';
    return sendError(res, msg, 500);
  }
});

export const notificationRoutes = router;
