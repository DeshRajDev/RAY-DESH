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

// Configure Cloudinary if credentials or CLOUDINARY_URL provided
const hasCloudinary = Boolean(
  (env.STORAGE_PROVIDER === 'cloudinary' && env.CLOUDINARY_CLOUD_NAME) ||
  (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY) ||
  process.env.CLOUDINARY_URL
);

if (hasCloudinary) {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
  } else {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
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

export const upload = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024, // 150MB max file size for high-def reels & photos
    files: 30, // Up to 30 files in a single bulk batch
  },
  fileFilter: (_req, file, cb) => {
    // Broad acceptance for mobile phones (including iPhone HEIC/HEIF/DNG, Android, MOV, MP4, etc.)
    const isMedia =
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/') ||
      /\.(jpg|jpeg|png|webp|gif|heic|heif|dng|avif|mp4|mov|quicktime|webm|mkv|3gp|mp3|wav|ogg|m4a)$/i.test(
        file.originalname
      );

    if (isMedia) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype} (${file.originalname})`));
    }
  },
});

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  duration?: number;
  storageProvider: 'cloudinary' | 'local' | 's3';
}

export async function processUploadedFile(file: Express.Multer.File): Promise<UploadResult> {
  if (!file) {
    throw new Error('No file provided for processing');
  }
  const mimeType = file.mimetype || 'application/octet-stream';
  const isVideo = mimeType.startsWith('video') || /\.(mp4|mov|webm|mkv|3gp)$/i.test(file.originalname || '');

  if (hasCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: isVideo ? 'video' : 'auto',
        folder: 'couple_sanctuary',
        chunk_size: 6000000, // 6MB chunking for large files
      });

      // Remove temporary local file
      try {
        fs.unlinkSync(file.path);
      } catch {
        // ignore
      }

      // Generate high quality video poster thumbnail URL
      let thumbnailUrl: string | undefined = undefined;
      if (isVideo) {
        // Cloudinary video thumbnail convention: change extension to .jpg
        thumbnailUrl = result.secure_url.replace(/\.[^/.]+$/, '.jpg');
      }

      return {
        url: result.secure_url,
        thumbnailUrl: thumbnailUrl || result.secure_url,
        storageKey: result.public_id,
        mimeType,
        sizeBytes: file.size,
        width: result.width,
        height: result.height,
        duration: result.duration ? Math.round(result.duration) : undefined,
        storageProvider: 'cloudinary',
      };
    } catch (err) {
      logger.error({ err }, 'Failed to upload to Cloudinary, falling back to local file storage');
    }
  }

  // Local storage relative public URL
  const publicUrl = `/uploads/${file.filename}`;
  return {
    url: publicUrl,
    thumbnailUrl: isVideo ? undefined : publicUrl,
    storageKey: file.filename,
    mimeType,
    sizeBytes: file.size,
    storageProvider: 'local',
  };
}
