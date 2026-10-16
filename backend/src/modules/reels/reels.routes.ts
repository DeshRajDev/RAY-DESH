import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Reel } from '../../models/Reel';
import { sendSuccess, sendError } from '../../utils/response';
import { parseAndValidateReelUrl } from './reels.validation';

const router = Router();

// GET all reels for couple
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, favorite } = req.query;
    const filter: Record<string, any> = { coupleId: req.couple!.id };

    if (favorite === 'true') {
      filter.isFavorite = true;
    }

    if (category && category !== 'All' && category !== 'favorites' && category !== 'recently_added') {
      filter.category = category;
    }

    const sortOrder: Record<string, 1 | -1> = category === 'recently_added' ? { savedAt: -1 } : { isFavorite: -1, savedAt: -1 };

    const reels = await Reel.find(filter).sort(sortOrder);
    return sendSuccess(res, reels.map((r: any) => r.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch reels';
    return sendError(res, msg, 500);
  }
});

// POST add reel to gallery
router.post('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { url, title, caption, category = 'romantic', isFavorite = false } = req.body;

    const validation = parseAndValidateReelUrl(url);
    if (!validation.valid || !validation.data) {
      return sendError(res, validation.error || 'Invalid video link', 400);
    }

    const { platform, shortcode, sourceUrl } = validation.data;

    // Check for duplicate in couple gallery
    const existingReel = await Reel.findOne({
      coupleId: req.couple!.id,
      $or: [
        { sourceUrl },
        ...(shortcode ? [{ shortcode, platform }] : []),
      ],
    });

    if (existingReel) {
      return sendError(res, 'This reel is already saved in our gallery!', 409);
    }

    const reel = await Reel.create({
      coupleId: req.couple!.id,
      createdBy: req.user!.id,
      createdByName: req.user!.name || 'Desh',
      platform,
      sourceUrl,
      shortcode,
      title: title || '',
      caption: caption || '',
      category: category || 'romantic',
      isFavorite: Boolean(isFavorite),
      savedAt: new Date(),
    });

    return sendSuccess(res, reel.toJSON(), 'Reel saved to gallery', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save reel';
    return sendError(res, msg, 500);
  }
});

// PATCH /:id (update details)
router.patch('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, caption, category, isFavorite } = req.body;
    const updates: Record<string, any> = {};

    if (title !== undefined) updates.title = title;
    if (caption !== undefined) updates.caption = caption;
    if (category !== undefined) updates.category = category;
    if (isFavorite !== undefined) updates.isFavorite = Boolean(isFavorite);

    const reel = await Reel.findOneAndUpdate(
      { _id: req.params.id, coupleId: req.couple!.id },
      { $set: updates },
      { new: true }
    );

    if (!reel) {
      return sendError(res, 'Reel not found', 404);
    }

    return sendSuccess(res, reel.toJSON(), 'Reel updated');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update reel';
    return sendError(res, msg, 500);
  }
});

// PATCH /:id/favorite (toggle favorite)
router.patch('/:id/favorite', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reel = await Reel.findOne({ _id: req.params.id, coupleId: req.couple!.id });
    if (!reel) {
      return sendError(res, 'Reel not found', 404);
    }

    reel.isFavorite = !reel.isFavorite;
    await reel.save();

    return sendSuccess(res, reel.toJSON(), reel.isFavorite ? 'Added to favorites' : 'Removed from favorites');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle favorite';
    return sendError(res, msg, 500);
  }
});

// DELETE /:id (remove reel)
router.delete('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reel = await Reel.findOneAndDelete({ _id: req.params.id, coupleId: req.couple!.id });
    if (!reel) {
      return sendError(res, 'Reel not found', 404);
    }

    return sendSuccess(res, { id: req.params.id }, 'Reel removed from gallery');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete reel';
    return sendError(res, msg, 500);
  }
});

export const reelsRoutes = router;
