import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Milestone } from '../../models/Milestone';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET all milestones
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const milestones = await Milestone.find({ coupleId: req.couple!.id }).sort({ date: 1 });
    return sendSuccess(res, milestones.map((m: any) => m.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch timeline';
    return sendError(res, msg, 500);
  }
});

// POST add milestone
router.post('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, title, description, location, photos = [], category = 'firsts', song, highlightQuote } = req.body;

    const milestone = await Milestone.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      date,
      title,
      description,
      location,
      photos,
      category,
      song,
      highlightQuote,
    });

    return sendSuccess(res, milestone.toJSON(), 'Milestone created', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create milestone';
    return sendError(res, msg, 500);
  }
});

// DELETE milestone
router.delete('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const milestone = await Milestone.findOneAndDelete({ _id: req.params.id, coupleId: req.couple!.id });
    if (!milestone) return sendError(res, 'Milestone not found', 404);
    return sendSuccess(res, { id: req.params.id }, 'Milestone deleted');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete milestone';
    return sendError(res, msg, 500);
  }
});

export const timelineRoutes = router;
