import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Memory } from '../../models/Memory';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET memories (with category filter)
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const query: Record<string, unknown> = {
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    const memories = await Memory.find(query).sort({ date: -1 });
    return sendSuccess(res, memories.map((m: any) => m.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch memories';
    return sendError(res, msg, 500);
  }
});

// GET single memory by ID
router.get('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const memory = await Memory.findOne({
      _id: req.params.id,
      coupleId: req.couple!.id,
    });

    if (!memory) return sendError(res, 'Memory not found', 404);
    return sendSuccess(res, memory.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch memory';
    return sendError(res, msg, 500);
  }
});

// POST create memory
router.post('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, date, location, category = 'Photos', mediaUrls = [], coverUrl, tags = [] } = req.body;

    const memory = await Memory.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      title,
      description,
      date,
      location,
      category,
      mediaUrls,
      coverUrl: coverUrl || (mediaUrls.length > 0 ? mediaUrls[0] : ''),
      tags,
      isFavorite: false,
      addedById: new mongoose.Types.ObjectId(req.user!.id),
      likes: 0,
      commentsCount: 0,
    });

    return sendSuccess(res, memory.toJSON(), 'Memory saved', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save memory';
    return sendError(res, msg, 500);
  }
});

// POST toggle favorite
router.post('/:id/favorite', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, coupleId: req.couple!.id });
    if (!memory) return sendError(res, 'Memory not found', 404);

    memory.isFavorite = !memory.isFavorite;
    await memory.save();

    return sendSuccess(res, memory.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to favorite memory';
    return sendError(res, msg, 500);
  }
});

// DELETE memory
router.delete('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const memory = await Memory.findOneAndDelete({
      _id: req.params.id,
      coupleId: req.couple!.id,
    });

    if (!memory) return sendError(res, 'Memory not found', 404);
    return sendSuccess(res, { id: req.params.id }, 'Memory deleted');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete memory';
    return sendError(res, msg, 500);
  }
});

export const memoryRoutes = router;
