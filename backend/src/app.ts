import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/request-id';
import { apiLimiter } from './middleware/rate-limit';
import { errorHandler } from './middleware/error-handler';
import { sendSuccess } from './utils/response';

// Route imports
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/users.routes';
import { coupleRoutes } from './modules/couples/couples.routes';
import { chatRoutes } from './modules/chat/chat.routes';
import { storyRoutes } from './modules/stories/stories.routes';
import { postRoutes } from './modules/posts/posts.routes';
import { memoryRoutes } from './modules/memories/memories.routes';
import { mediaRoutes } from './modules/media/media.routes';
import { favoriteRoutes } from './modules/favorites/favorites.routes';
import { musicRoutes } from './modules/music/music.routes';
import { dateRoutes } from './modules/dates/dates.routes';
import { birthdayRoutes } from './modules/birthdays/birthdays.routes';
import { bucketListRoutes } from './modules/bucket-list/bucket-list.routes';
import { tripRoutes } from './modules/trips/trips.routes';
import { placeRoutes } from './modules/places/places.routes';
import { journalRoutes } from './modules/journal/journal.routes';
import { loveLetterRoutes } from './modules/love-letters/love-letters.routes';
import { timelineRoutes } from './modules/timeline/timeline.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { searchRoutes } from './modules/search/search.routes';
import { reelsRoutes } from './modules/reels/reels.routes';

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS
  app.use(cors(corsOptions));

  // Parsers & IDs
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(requestIdMiddleware);

  // Rate Limiting
  app.use('/api', apiLimiter);

  // Serve local uploaded files and songs statically
  const uploadsPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
  app.use('/uploads', express.static(uploadsPath));
  const songsPath = path.resolve(process.cwd(), 'songs');
  app.use('/songs', express.static(songsPath));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    return sendSuccess(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: '1.0.0',
    });
  });

  // API v1 Routing
  const apiV1 = express.Router();
  apiV1.use('/auth', authRoutes);
  apiV1.use('/users', userRoutes);
  apiV1.use('/couples', coupleRoutes);
  apiV1.use('/chat', chatRoutes);
  apiV1.use('/stories', storyRoutes);
  apiV1.use('/posts', postRoutes);
  apiV1.use('/memories', memoryRoutes);
  apiV1.use('/media', mediaRoutes);
  apiV1.use('/favorites', favoriteRoutes);
  apiV1.use('/music', musicRoutes);
  apiV1.use('/dates', dateRoutes);
  apiV1.use('/birthdays', birthdayRoutes);
  apiV1.use('/bucket-list', bucketListRoutes);
  apiV1.use('/trips', tripRoutes);
  apiV1.use('/places', placeRoutes);
  apiV1.use('/journal', journalRoutes);
  apiV1.use('/love-letters', loveLetterRoutes);
  apiV1.use('/timeline', timelineRoutes);
  apiV1.use('/notifications', notificationRoutes);
  apiV1.use('/search', searchRoutes);
  apiV1.use('/reels', reelsRoutes);

  app.use('/api/v1', apiV1);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      error: { code: 'NOT_FOUND' },
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
