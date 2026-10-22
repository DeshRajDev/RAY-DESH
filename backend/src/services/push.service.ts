import webpush from 'web-push';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { PushSubscription } from '../models/PushSubscription';
import mongoose from 'mongoose';

let isVapidInitialized = false;

export function initVapid(): boolean {
  if (isVapidInitialized) return true;

  const publicKey = env.VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT || process.env.VAPID_SUBJECT || 'mailto:contact@ray.app';

  if (!publicKey || !privateKey) {
    logger.warn('⚠️ Web Push VAPID keys not configured in environment. Push notifications are disabled until VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are set.');
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isVapidInitialized = true;
    logger.info('✅ Web Push VAPID configuration initialized successfully.');
    return true;
  } catch (err: any) {
    logger.error('❌ Failed to initialize Web Push VAPID details: ' + (err?.message || 'Invalid keys'));
    return false;
  }
}

// Attempt validation at startup without crashing
initVapid();

export function isPushConfigured(): boolean {
  return initVapid();
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, unknown>;
}

export async function sendPushToUser(
  userId: string | mongoose.Types.ObjectId,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  try {
    if (!initVapid()) {
      return { sent: 0, failed: 0 };
    }

    const subscriptions = await PushSubscription.find({ userId: new mongoose.Types.ObjectId(userId) });
    if (!subscriptions || subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const stringifiedPayload = JSON.stringify({
      title: payload.title || 'Ray',
      body: payload.body || 'You have a new update in your sanctuary.',
      icon: payload.icon || '/icons/icon-192.png',
      badge: payload.badge || '/icons/icon-192.png',
      url: payload.url || '/chat',
      data: payload.data || {},
    });

    let sent = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (sub: any) => {
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        };

        try {
          await webpush.sendNotification(pushConfig, stringifiedPayload);
          sent++;
        } catch (err: any) {
          failed++;
          // If subscription is expired or unsubscribed, delete it
          if (err.statusCode === 404 || err.statusCode === 410) {
            logger.info({ endpoint: sub.endpoint }, 'Push subscription expired, pruning from DB');
            await PushSubscription.deleteOne({ _id: sub._id });
          } else {
            logger.warn({ err: err.message, endpoint: sub.endpoint }, 'Web push delivery failed');
          }
        }
      })
    );

    return { sent, failed };
  } catch (err) {
    logger.error({ err }, 'Error in sendPushToUser');
    return { sent: 0, failed: 0 };
  }
}
