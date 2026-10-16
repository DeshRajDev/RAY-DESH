import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { logger } from '../utils/logger';

// Ensure local uploads directory exists
const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Cloudinary if credentials provided
if (env.STORAGE_PROVIDER === 'cloudinary' && env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info('☁️ Cloudinary storage configured.');
}

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (_req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `media-${uniqueSuffix}${ext}`);
  },
});

const allowedMimes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
];

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file MIME type: ${file.mimetype}`));
    }
  },
});

export interface UploadResult {
  url: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
}

export async function processUploadedFile(file: Express.Multer.File): Promise<UploadResult> {
  if (env.STORAGE_PROVIDER === 'cloudinary' && env.CLOUDINARY_CLOUD_NAME) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: file.mimetype.startsWith('video') ? 'video' : 'auto',
        folder: 'couple_sanctuary',
      });
      // Remove temporary local file
      fs.unlinkSync(file.path);
      return {
        url: result.secure_url,
        storageKey: result.public_id,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      };
    } catch (err) {
      logger.error({ err }, 'Failed to upload to Cloudinary, falling back to local file storage');
    }
  }

  // Local storage relative public URL
  const publicUrl = `/uploads/${file.filename}`;
  return {
    url: publicUrl,
    storageKey: file.filename,
    mimeType: file.mimetype,
    sizeBytes: file.size,
  };
}
