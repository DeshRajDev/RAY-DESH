import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { upload, processUploadedFile } from '../../config/storage';
import { MediaAsset } from '../../models/MediaAsset';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// POST upload single media file
router.post('/upload', authenticate, requireCouple, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file provided', 400);
    }

    const processed = await processUploadedFile(req.file);

    let mediaType: 'image' | 'video' | 'audio' | 'document' = 'image';
    if (processed.mimeType.startsWith('video')) mediaType = 'video';
    else if (processed.mimeType.startsWith('audio')) mediaType = 'audio';

    const asset = await MediaAsset.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      ownerId: new mongoose.Types.ObjectId(req.user!.id),
      storageKey: processed.storageKey,
      url: processed.url,
      mediaType,
      mimeType: processed.mimeType,
      sizeBytes: processed.sizeBytes,
    });

    return sendSuccess(res, asset.toJSON(), 'File uploaded successfully', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'File upload failed';
    return sendError(res, msg, 500);
  }
});

// GET media assets gallery
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assets = await MediaAsset.find({ coupleId: req.couple!.id }).sort({ createdAt: -1 });
    return sendSuccess(res, assets.map((a: any) => a.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch media assets';
    return sendError(res, msg, 500);
  }
});

export const mediaRoutes = router;
