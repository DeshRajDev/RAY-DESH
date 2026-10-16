import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Place } from '../../models/Place';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET all places
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const places = await Place.find({ coupleId: req.couple!.id }).sort({ createdAt: -1 });
    return sendSuccess(res, places.map((p: any) => p.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch places';
    return sendError(res, msg, 500);
  }
});

// POST add place
router.post('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, category = 'been', country, city, coordinates, visitedDate, rating, notes, photos = [] } = req.body;

    const place = await Place.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      name,
      category,
      country,
      city,
      coordinates,
      visitedDate,
      rating,
      notes,
      photos,
      isFavorite: false,
      addedById: new mongoose.Types.ObjectId(req.user!.id),
    });

    return sendSuccess(res, place.toJSON(), 'Place saved', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save place';
    return sendError(res, msg, 500);
  }
});

// POST toggle favorite
router.post('/:id/favorite', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const place = await Place.findOne({ _id: req.params.id, coupleId: req.couple!.id });
    if (!place) return sendError(res, 'Place not found', 404);

    place.isFavorite = !place.isFavorite;
    await place.save();

    return sendSuccess(res, place.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to favorite place';
    return sendError(res, msg, 500);
  }
});

// DELETE place
router.delete('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const place = await Place.findOneAndDelete({ _id: req.params.id, coupleId: req.couple!.id });
    if (!place) return sendError(res, 'Place not found', 404);
    return sendSuccess(res, { id: req.params.id }, 'Place deleted');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete place';
    return sendError(res, msg, 500);
  }
});

export const placeRoutes = router;
