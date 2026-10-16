import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Journal } from '../../models/Journal';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET journal entries (respecting privacy: if isPrivate, only author can see)
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const coupleId = req.couple!.id;

    const entries = await Journal.find({
      coupleId,
      $or: [
        { isPrivate: false },
        { authorId: userId },
      ],
    }).sort({ date: -1 });

    return sendSuccess(res, entries.map((e: any) => e.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch journal entries';
    return sendError(res, msg, 500);
  }
});

// GET single entry by ID
router.get('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entry = await Journal.findOne({
      _id: req.params.id,
      coupleId: req.couple!.id,
    });

    if (!entry) return sendError(res, 'Entry not found', 404);

    if (entry.isPrivate && entry.authorId.toString() !== req.user!.id) {
      return sendError(res, 'Access denied to private journal entry', 403);
    }

    return sendSuccess(res, entry.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch entry';
    return sendError(res, msg, 500);
  }
});

// POST create journal entry
router.post('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, date, mood = 'romantic', weather, location, photos = [], isPrivate = false, musicTrack } = req.body;

    const entry = await Journal.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      authorId: new mongoose.Types.ObjectId(req.user!.id),
      authorName: req.user!.name,
      title,
      content,
      date: date || new Date().toISOString(),
      mood,
      weather,
      location,
      photos,
      isPrivate,
      musicTrack,
      isFavorite: false,
      partnerRead: false,
      reactions: [],
    });

    return sendSuccess(res, entry.toJSON(), 'Journal entry saved', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save entry';
    return sendError(res, msg, 500);
  }
});

// POST toggle partner read
router.post('/:id/read', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entry = await Journal.findOne({ _id: req.params.id, coupleId: req.couple!.id });
    if (!entry) return sendError(res, 'Entry not found', 404);

    entry.partnerRead = true;
    await entry.save();

    return sendSuccess(res, entry.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to mark read';
    return sendError(res, msg, 500);
  }
});

// DELETE entry
router.delete('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entry = await Journal.findOneAndDelete({
      _id: req.params.id,
      coupleId: req.couple!.id,
      authorId: req.user!.id,
    });

    if (!entry) return sendError(res, 'Entry not found or unauthorized', 404);
    return sendSuccess(res, { id: req.params.id }, 'Entry deleted');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete entry';
    return sendError(res, msg, 500);
  }
});

export const journalRoutes = router;
