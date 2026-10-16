import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { DateEvent } from '../../models/DateEvent';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET all date events
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const events = await DateEvent.find({ coupleId: req.couple!.id }).sort({ date: 1 });
    return sendSuccess(res, events.map((e: any) => e.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch dates';
    return sendError(res, msg, 500);
  }
});

// POST add date event
router.post('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, date, type = 'Special', description, location, isRecurringYearly = false, remindDaysBefore = [1], photos = [], notes } = req.body;

    const event = await DateEvent.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      title,
      date,
      type,
      description,
      location,
      isRecurringYearly,
      remindDaysBefore,
      photos,
      notes,
    });

    return sendSuccess(res, event.toJSON(), 'Date event added', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add date event';
    return sendError(res, msg, 500);
  }
});

// DELETE date event
router.delete('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const event = await DateEvent.findOneAndDelete({ _id: req.params.id, coupleId: req.couple!.id });
    if (!event) return sendError(res, 'Event not found', 404);
    return sendSuccess(res, { id: req.params.id }, 'Event deleted');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete date event';
    return sendError(res, msg, 500);
  }
});

export const dateRoutes = router;
