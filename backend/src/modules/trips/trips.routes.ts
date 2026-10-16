import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Trip } from '../../models/Trip';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET all trips
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trips = await Trip.find({ coupleId: req.couple!.id }).sort({ startDate: -1 });
    return sendSuccess(res, trips.map((t: any) => t.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch trips';
    return sendError(res, msg, 500);
  }
});

// GET trip by ID
router.get('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, coupleId: req.couple!.id });
    if (!trip) return sendError(res, 'Trip not found', 404);
    return sendSuccess(res, trip.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch trip';
    return sendError(res, msg, 500);
  }
});

// POST create trip
router.post('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, destination, startDate, endDate, coverUrl, status = 'planned', itinerary = [], locations = [], packingList = [], notes } = req.body;

    const trip = await Trip.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      title,
      destination,
      startDate,
      endDate,
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      status,
      itinerary,
      locations,
      packingList,
      notes,
    });

    return sendSuccess(res, trip.toJSON(), 'Trip created', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create trip';
    return sendError(res, msg, 500);
  }
});

// DELETE trip
router.delete('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, coupleId: req.couple!.id });
    if (!trip) return sendError(res, 'Trip not found', 404);
    return sendSuccess(res, { id: req.params.id }, 'Trip deleted');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete trip';
    return sendError(res, msg, 500);
  }
});

export const tripRoutes = router;
