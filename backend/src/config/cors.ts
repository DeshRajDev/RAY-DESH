import { CorsOptions } from 'cors';
import { env } from './env';

// Normalize allowed origins (strip trailing slashes, parse comma-separated lists)
const rawOrigins = [
  env.FRONTEND_URL,
  'https://ray-desh-3yje.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const normalizedOrigins = new Set<string>();

rawOrigins.forEach(item => {
  if (!item) return;
  item.split(',').forEach(url => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (trimmed) {
      normalizedOrigins.add(trimmed);
    }
  });
});

export const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    // Direct match against known origins
    if (normalizedOrigins.has(cleanOrigin)) {
      return callback(null, true);
    }

    // Allow any Vercel deployment preview for this app
    if (cleanOrigin.endsWith('.vercel.app') && cleanOrigin.includes('ray-desh')) {
      return callback(null, true);
    }

    // Fallback in non-production
    if (env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86400, // 24 hours
};
