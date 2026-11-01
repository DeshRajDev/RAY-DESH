import { Router, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { upload, processUploadedFile } from '../../config/storage';
import { MediaAsset } from '../../models/MediaAsset';
import { Reel } from '../../models/Reel';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

function parseList(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
    } catch {
      return input.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
  }
  return [];
}

/**
 * Synchronize a MediaAsset with the Reels section if it is a video and tagged 'reels'
 */
async function syncReelForAsset(asset: any, coupleId: string, userId: string, userName: string) {
  const isVideo = asset.mediaType === 'video';
  const hasReelsCategory = asset.categories && asset.categories.includes('reels');

  if (isVideo && hasReelsCategory) {
    try {
      const existing = await Reel.findOne({
        coupleId: new mongoose.Types.ObjectId(coupleId),
        $or: [{ mediaAssetId: asset._id }, { sourceUrl: asset.url }],
      });

      if (!existing) {
        await Reel.create({
          coupleId: new mongoose.Types.ObjectId(coupleId),
          createdBy: new mongoose.Types.ObjectId(userId),
          createdByName: userName || 'Desh',
          platform: 'upload',
          sourceUrl: asset.url,
          thumbnailUrl: asset.thumbnailUrl || asset.url,
          mediaAssetId: asset._id,
          title: asset.title || 'Romantic Reel',
          caption: asset.caption || '',
          category: 'romantic',
          isFavorite: Boolean(asset.isFavorite),
          savedAt: asset.createdAt || new Date(),
        });
      } else {
        existing.title = asset.title || existing.title;
        existing.caption = asset.caption || existing.caption;
        existing.thumbnailUrl = asset.thumbnailUrl || existing.thumbnailUrl;
        existing.isFavorite = Boolean(asset.isFavorite);
        await existing.save();
      }
    } catch (err) {
      console.warn('Failed to sync reel for media asset:', err);
    }
  }
}

// GET upload endpoint status helper
router.get('/upload', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'Media upload endpoint is active. Send a POST request with multipart/form-data containing "file" and your Authorization Bearer token.',
  });
});

// POST generate secure signed upload parameters for direct client -> Cloudinary upload
router.post('/sign-upload', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cloudName = env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
    const apiSecret = env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return sendError(res, 'Direct Cloudinary upload is not configured on the server', 503);
    }

    const { resourceType = 'auto' } = req.body;
    const validResourceType = resourceType === 'video' ? 'video' : resourceType === 'image' ? 'image' : 'auto';
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'couple_sanctuary';

    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return sendSuccess(res, {
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      resourceType: validResourceType,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${validResourceType}/upload`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate upload signature';
    return sendError(res, msg, 500);
  }
});

// POST confirm direct-to-Cloudinary upload and save metadata to MongoDB (idempotent)
router.post('/confirm-upload', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      publicId,
      url,
      thumbnailUrl,
      mediaType = 'image',
      mimeType = 'image/jpeg',
      sizeBytes = 0,
      width,
      height,
      duration,
      title,
      caption,
      description,
      categories,
      tags,
      isFavorite,
      originalFilename,
      takenAt,
    } = req.body;

    if (!url || !publicId) {
      return sendError(res, 'Missing required Cloudinary asset information (url or publicId)', 400);
    }

    // Idempotency: avoid duplicate records if client retried
    const existing = await MediaAsset.findOne({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      storageKey: publicId,
    });
    if (existing) {
      return sendSuccess(res, existing.toJSON(), 'Media already recorded', 200);
    }

    let resolvedMediaType: 'image' | 'video' | 'audio' | 'document' = 'image';
    if (mediaType === 'video' || mimeType.startsWith('video')) resolvedMediaType = 'video';
    else if (mediaType === 'audio' || mimeType.startsWith('audio')) resolvedMediaType = 'audio';

    const parsedCategories = parseList(categories);
    if (parsedCategories.length === 0) parsedCategories.push('uncategorized');

    // Video thumbnail generation convention for Cloudinary: change extension to .jpg
    let resolvedThumbnail = thumbnailUrl;
    if (resolvedMediaType === 'video' && !resolvedThumbnail) {
      resolvedThumbnail = url.replace(/\.[^/.]+$/, '.jpg');
    }

    const asset = await MediaAsset.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      ownerId: new mongoose.Types.ObjectId(req.user!.id),
      ownerRole: req.user!.role,
      storageKey: publicId,
      url,
      thumbnailUrl: resolvedThumbnail || url,
      mediaType: resolvedMediaType,
      mimeType,
      sizeBytes: Number(sizeBytes) || 0,
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      duration: duration ? Math.round(Number(duration)) : undefined,
      title: title ? String(title).trim() : (originalFilename?.replace(/\.[^/.]+$/, '') || 'Romantic Moment'),
      caption: caption ? String(caption).trim() : '',
      description: description ? String(description).trim() : '',
      categories: parsedCategories,
      tags: parseList(tags),
      originalFilename: originalFilename || 'uploaded_media',
      storageProvider: 'cloudinary',
      isFavorite: isFavorite === 'true' || isFavorite === true,
      isPublished: true,
      takenAt: takenAt ? new Date(takenAt) : undefined,
    });

    // Auto-sync with Reels if applicable
    await syncReelForAsset(asset, req.couple!.id, req.user!.id, req.user!.name);

    return sendSuccess(res, asset.toJSON(), 'Media confirmed and saved', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to confirm upload';
    return sendError(res, msg, 500);
  }
});

// POST upload single media file with categories & tags (flexible for file, image, media, or video field names)
router.post('/upload', authenticate, requireCouple, upload.any(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawFiles = req.files as Express.Multer.File[] | undefined;
    const file = req.file || (rawFiles && Array.isArray(rawFiles) && rawFiles.length > 0 ? rawFiles[0] : undefined);
    if (!file) {
      return sendError(res, 'No file provided. Please attach a file using form-data field "file" or "image".', 400);
    }

    const { title, caption, description, categories, tags, isFavorite, takenAt } = req.body;
    req.file = file;
    const processed = await processUploadedFile(file);

    let mediaType: 'image' | 'video' | 'audio' | 'document' = 'image';
    if (processed.mimeType.startsWith('video')) mediaType = 'video';
    else if (processed.mimeType.startsWith('audio')) mediaType = 'audio';

    const parsedCategories = parseList(categories);
    if (parsedCategories.length === 0) parsedCategories.push('uncategorized');

    const asset = await MediaAsset.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      ownerId: new mongoose.Types.ObjectId(req.user!.id),
      ownerRole: req.user!.role,
      storageKey: processed.storageKey,
      url: processed.url,
      thumbnailUrl: processed.thumbnailUrl,
      mediaType,
      mimeType: processed.mimeType,
      sizeBytes: processed.sizeBytes,
      width: processed.width,
      height: processed.height,
      duration: processed.duration,
      title: title ? String(title).trim() : (file.originalname.replace(/\.[^/.]+$/, '') || ''),
      caption: caption ? String(caption).trim() : '',
      description: description ? String(description).trim() : '',
      categories: parsedCategories,
      tags: parseList(tags),
      originalFilename: file.originalname,
      storageProvider: processed.storageProvider,
      isFavorite: isFavorite === 'true' || isFavorite === true,
      isPublished: true,
      takenAt: takenAt ? new Date(takenAt) : undefined,
    });

    // Auto-sync with Reels section if applicable
    await syncReelForAsset(asset, req.couple!.id, req.user!.id, req.user!.name);

    return sendSuccess(res, asset.toJSON(), 'File uploaded successfully', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'File upload failed';
    return sendError(res, msg, 500);
  }
});

// POST bulk upload multiple files (supports 20+ reels/photos from mobile/desktop)
router.post('/upload-multiple', authenticate, requireCouple, upload.array('files', 30), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return sendError(res, 'No files provided for bulk upload', 400);
    }

    const { defaultCategories, defaultTags, isFavorite, commonTitle } = req.body;
    const parsedCategories = parseList(defaultCategories);
    if (parsedCategories.length === 0) parsedCategories.push('uncategorized');
    const parsedTags = parseList(defaultTags);

    const uploadedAssets = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const processed = await processUploadedFile(file);

        let mediaType: 'image' | 'video' | 'audio' | 'document' = 'image';
        if (processed.mimeType.startsWith('video')) mediaType = 'video';
        else if (processed.mimeType.startsWith('audio')) mediaType = 'audio';

        const itemTitle = commonTitle ? `${commonTitle} (${i + 1})` : file.originalname.replace(/\.[^/.]+$/, '');

        const asset = await MediaAsset.create({
          coupleId: new mongoose.Types.ObjectId(req.couple!.id),
          ownerId: new mongoose.Types.ObjectId(req.user!.id),
          ownerRole: req.user!.role,
          storageKey: processed.storageKey,
          url: processed.url,
          thumbnailUrl: processed.thumbnailUrl,
          mediaType,
          mimeType: processed.mimeType,
          sizeBytes: processed.sizeBytes,
          width: processed.width,
          height: processed.height,
          duration: processed.duration,
          title: itemTitle,
          categories: parsedCategories,
          tags: parsedTags,
          originalFilename: file.originalname,
          storageProvider: processed.storageProvider,
          isFavorite: isFavorite === 'true' || isFavorite === true,
          isPublished: true,
          displayOrder: i,
        });

        await syncReelForAsset(asset, req.couple!.id, req.user!.id, req.user!.name);
        uploadedAssets.push(asset.toJSON());
      } catch (fileErr) {
        console.error(`Failed to process bulk file ${file.originalname}:`, fileErr);
      }
    }

    return sendSuccess(
      res,
      {
        totalUploaded: uploadedAssets.length,
        totalFailed: files.length - uploadedAssets.length,
        assets: uploadedAssets,
      },
      `Successfully uploaded ${uploadedAssets.length} of ${files.length} files`,
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Bulk upload failed';
    return sendError(res, msg, 500);
  }
});

// GET media assets with comprehensive category, type, tag, and search filtering
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, mediaType, favorite, tag, search, limit = 50, page = 1 } = req.query;

    const query: Record<string, any> = {
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      isPublished: true,
    };

    if (category && category !== 'All' && category !== 'all') {
      query.categories = String(category).toLowerCase();
    }

    if (mediaType && mediaType !== 'all') {
      query.mediaType = String(mediaType).toLowerCase();
    }

    if (favorite === 'true') {
      query.isFavorite = true;
    }

    if (tag) {
      query.tags = String(tag).toLowerCase();
    }

    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { title: regex },
        { caption: regex },
        { description: regex },
        { tags: regex },
        { originalFilename: regex },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [assets, totalCount] = await Promise.all([
      MediaAsset.find(query).sort({ isFavorite: -1, displayOrder: 1, createdAt: -1 }).skip(skip).limit(limitNum),
      MediaAsset.countDocuments(query),
    ]);

    return sendSuccess(res, {
      items: assets.map((a: any) => a.toJSON()),
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch media assets';
    return sendError(res, msg, 500);
  }
});

// GET section-specific media mapping (e.g. reels, memories, feed, trips, birthday, gallery)
router.get('/section/:section', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sectionName = String(req.params.section).toLowerCase().trim();
    const assets = await MediaAsset.find({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      categories: sectionName,
      isPublished: true,
    }).sort({ isFavorite: -1, createdAt: -1 });

    return sendSuccess(res, assets.map((a: any) => a.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch section media';
    return sendError(res, msg, 500);
  }
});

// GET single media asset
router.get('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const asset = await MediaAsset.findOne({
      _id: req.params.id,
      coupleId: req.couple!.id,
    });

    if (!asset) {
      return sendError(res, 'Media asset not found', 404);
    }

    return sendSuccess(res, asset.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch media asset';
    return sendError(res, msg, 500);
  }
});

// PATCH update media details (title, caption, tags, categories, isFavorite, etc.)
router.patch('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, caption, description, tags, categories, isFavorite, isPublished, displayOrder, takenAt } = req.body;
    const updates: Record<string, any> = {};

    if (title !== undefined) updates.title = String(title).trim();
    if (caption !== undefined) updates.caption = String(caption).trim();
    if (description !== undefined) updates.description = String(description).trim();
    if (tags !== undefined) updates.tags = parseList(tags);
    if (categories !== undefined) updates.categories = parseList(categories);
    if (isFavorite !== undefined) updates.isFavorite = Boolean(isFavorite);
    if (isPublished !== undefined) updates.isPublished = Boolean(isPublished);
    if (displayOrder !== undefined) updates.displayOrder = Number(displayOrder);
    if (takenAt !== undefined) updates.takenAt = takenAt ? new Date(takenAt) : undefined;

    const asset = await MediaAsset.findOneAndUpdate(
      { _id: req.params.id, coupleId: req.couple!.id },
      { $set: updates },
      { new: true }
    );

    if (!asset) {
      return sendError(res, 'Media asset not found', 404);
    }

    // Keep reel synchronized if reels category was added or modified
    await syncReelForAsset(asset, req.couple!.id, req.user!.id, req.user!.name);

    return sendSuccess(res, asset.toJSON(), 'Media updated successfully');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update media';
    return sendError(res, msg, 500);
  }
});

// PATCH bulk update multiple assets (e.g. bulk add categories, bulk favorite, bulk tag)
router.patch('/bulk/update', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids, addCategories, removeCategories, addTags, isFavorite } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 'No asset IDs provided', 400);
    }

    const objectIds = ids.map((id: string) => new mongoose.Types.ObjectId(id));
    const updates: Record<string, any> = {};

    if (isFavorite !== undefined) {
      updates.$set = { isFavorite: Boolean(isFavorite) };
    }

    if (addCategories && Array.isArray(addCategories)) {
      updates.$addToSet = { ...(updates.$addToSet || {}), categories: { $each: parseList(addCategories) } };
    }

    if (removeCategories && Array.isArray(removeCategories)) {
      updates.$pull = { ...(updates.$pull || {}), categories: { $in: parseList(removeCategories) } };
    }

    if (addTags && Array.isArray(addTags)) {
      updates.$addToSet = { ...(updates.$addToSet || {}), tags: { $each: parseList(addTags) } };
    }

    const result = await MediaAsset.updateMany(
      { _id: { $in: objectIds }, coupleId: req.couple!.id },
      updates
    );

    return sendSuccess(res, { modifiedCount: result.modifiedCount }, 'Bulk update applied');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to apply bulk update';
    return sendError(res, msg, 500);
  }
});

// DELETE media asset
// If ?removeFromCategory=reels is passed, only removes that category tag and associated section link, preserving the file!
router.delete('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { removeFromCategory } = req.query;

    const asset = await MediaAsset.findOne({
      _id: req.params.id,
      coupleId: req.couple!.id,
    });

    if (!asset) {
      return sendError(res, 'Media asset not found', 404);
    }

    if (removeFromCategory) {
      const catToRemove = String(removeFromCategory).toLowerCase().trim();
      asset.categories = asset.categories.filter((c: string) => c !== catToRemove);
      if (asset.categories.length === 0) asset.categories.push('uncategorized');
      await asset.save();

      // If removed from reels, remove linked Reel record
      if (catToRemove === 'reels') {
        await Reel.deleteOne({ mediaAssetId: asset._id, coupleId: req.couple!.id });
      }

      return sendSuccess(res, asset.toJSON(), `Removed from ${catToRemove} section while preserving original media`);
    }

    // Permanent delete
    await MediaAsset.deleteOne({ _id: asset._id });
    await Reel.deleteOne({ mediaAssetId: asset._id });

    return sendSuccess(res, { id: req.params.id }, 'Media deleted permanently');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete media';
    return sendError(res, msg, 500);
  }
});

// POST bulk delete assets
router.post('/bulk/delete', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 'No asset IDs provided', 400);
    }

    const objectIds = ids.map((id: string) => new mongoose.Types.ObjectId(id));
    await MediaAsset.deleteMany({ _id: { $in: objectIds }, coupleId: req.couple!.id });
    await Reel.deleteMany({ mediaAssetId: { $in: objectIds } });

    return sendSuccess(res, { deletedCount: ids.length }, `Successfully deleted ${ids.length} media items`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to bulk delete media';
    return sendError(res, msg, 500);
  }
});

export const mediaRoutes = router;
