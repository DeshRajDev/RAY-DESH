/// <reference path="../../../declarations.d.ts" />
/// <reference path="../../declarations.d.ts" />
import cron from 'node-cron';
import { Story } from '../models/Story';
import { DateEvent } from '../models/DateEvent';
import { Notification } from '../models/Notification';
import { Couple } from '../models/Couple';
import { logger } from '../utils/logger';
import { daysUntil } from '../utils/date-calculator';

export function startScheduledJobs(): void {
  // 1. Story Expiration Cleanup (Every hour)
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const result = await Story.updateMany(
        { expiresAt: { $lte: now }, isArchived: false },
        { isArchived: true }
      );
      if (result.modifiedCount > 0) {
        logger.info(`🧹 Archived ${result.modifiedCount} expired stories.`);
      }
    } catch (err) {
      logger.error({ err }, 'Error during story expiration cleanup job');
    }
  });

  // 2. Birthday & Anniversary Reminders (Daily at 9:00 AM)
  cron.schedule('0 9 * * *', async () => {
    try {
      const couples = await Couple.find();

      for (const couple of couples) {
        const events = await DateEvent.find({ coupleId: couple._id });

        for (const event of events) {
          const daysLeft = daysUntil(event.date, event.isRecurringYearly);

          if (event.remindDaysBefore?.includes(daysLeft)) {
            // Deduplicate: check if notification already sent today for this event
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const existing = await Notification.findOne({
              coupleId: couple._id,
              title: { $regex: event.title },
              createdAt: { $gte: todayStart },
            });

            if (!existing) {
              await Notification.create({
                coupleId: couple._id,
                recipientId: couple.partner1,
                type: 'date_soon',
                title: `${event.title} is in ${daysLeft} day${daysLeft === 1 ? '' : 's'}!`,
                description: event.description || 'Check your shared calendar for details.',
                isRead: false,
                linkUrl: '/dates',
                actionText: 'View Date',
              });

              await Notification.create({
                coupleId: couple._id,
                recipientId: couple.partner2,
                type: 'date_soon',
                title: `${event.title} is in ${daysLeft} day${daysLeft === 1 ? '' : 's'}!`,
                description: event.description || 'Check your shared calendar for details.',
                isRead: false,
                linkUrl: '/dates',
                actionText: 'View Date',
              });
            }
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error during date reminder job');
    }
  });

  logger.info('⏰ Background cron schedulers initialized.');
}
