import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { BucketList } from '../../models/BucketList';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET all bucket list items
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await BucketList.find({ coupleId: req.couple!.id }).sort({ isCompleted: 1, createdAt: -1 });
    return sendSuccess(res, items.map((i: any) => i.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch bucket list';
    return sendError(res, msg, 500);
  }
});

// POST add bucket list item
router.post('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category = 'Travel', priority = 'medium', location } = req.body;

    const item = await BucketList.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      title,
      description,
      category,
      priority,
      isCompleted: false,
      location,
      addedById: new mongoose.Types.ObjectId(req.user!.id),
    });

    return sendSuccess(res, item.toJSON(), 'Bucket list item created', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create item';
    return sendError(res, msg, 500);
  }
});

// POST toggle complete
router.post('/:id/toggle', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await BucketList.findOne({ _id: req.params.id, coupleId: req.couple!.id });
    if (!item) return sendError(res, 'Item not found', 404);

    item.isCompleted = !item.isCompleted;
    item.completedDate = item.isCompleted ? new Date().toISOString() : undefined;
    await item.save();

    return sendSuccess(res, item.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle item';
    return sendError(res, msg, 500);
  }
});

// DELETE item
router.delete('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await BucketList.findOneAndDelete({ _id: req.params.id, coupleId: req.couple!.id });
    if (!item) return sendError(res, 'Item not found', 404);
    return sendSuccess(res, { id: req.params.id }, 'Item deleted');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete item';
    return sendError(res, msg, 500);
  }
});

export const bucketListRoutes = router;
