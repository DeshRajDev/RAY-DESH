import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

import fs from 'fs';

const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
  path.resolve(__dirname, '../../.env'),
];
for (const p of possibleEnvPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/couple_sanctuary'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(16).default('super_secret_couple_sanctuary_jwt_key_2026_desh_rey'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_SECRET: z.string().min(16).default('super_secret_refresh_jwt_key_2026_desh_rey'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  COOKIE_SECRET: z.string().default('couple_sanctuary_cookie_secret_key_2026'),
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  JAMENDO_CLIENT_ID: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().default('BLFzG-mYjRmaxB9jUcTkGARwfFbjJX0NmSuWucuiHoAoVx8xS3pS7BVND4jl8AhzqHHdIaD4-S5glMKqZ02N8w4'),
  VAPID_PRIVATE_KEY: z.string().default('ovDjDQXKTJ83posPdkb1-6Bkn-xJ3clvLUrCAsNLHy4'),
  VAPID_SUBJECT: z.string().default('mailto:admin@couple.local'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
