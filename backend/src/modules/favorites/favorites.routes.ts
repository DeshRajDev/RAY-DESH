import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Favorite } from '../../models/Favorite';
import { Memory } from '../../models/Memory';
import { Song } from '../../models/Song';
import { Message } from '../../models/Message';
import { Place } from '../../models/Place';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET all favorites grouped or filtered by type
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coupleId = req.couple!.id;
    const type = req.query.type as string | undefined;

    const query: Record<string, unknown> = {
      coupleId: new mongoose.Types.ObjectId(coupleId),
    };

    if (type) {
      query.resourceType = type;
    }

    const favs = await Favorite.find(query);

    // Fetch corresponding populated items
    const [memories, songs, messages, places] = await Promise.all([
      Memory.find({ coupleId, isFavorite: true }),
      Song.find({ coupleId, isFavorite: true }),
      Message.find({ coupleId, isFavorite: true }),
      Place.find({ coupleId, isFavorite: true }),
    ]);

    return sendSuccess(res, {
      favorites: favs.map((f: any) => f.toJSON()),
      memories: memories.map((m: any) => m.toJSON()),
      songs: songs.map((s: any) => s.toJSON()),
      messages: messages.map((m: any) => m.toJSON()),
      places: places.map((p: any) => p.toJSON()),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch favorites';
    return sendError(res, msg, 500);
  }
});

// POST toggle favorite
router.post('/toggle', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resourceType, resourceId } = req.body;
    const userId = req.user!.id;
    const coupleId = req.couple!.id;

    const existing = await Favorite.findOne({
      coupleId,
      userId,
      resourceType,
      resourceId,
    });

    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      return sendSuccess(res, { favorited: false });
    } else {
      await Favorite.create({
        coupleId: new mongoose.Types.ObjectId(coupleId),
        userId: new mongoose.Types.ObjectId(userId),
        resourceType,
        resourceId,
      });
      return sendSuccess(res, { favorited: true });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle favorite';
    return sendError(res, msg, 500);
  }
});

export const favoriteRoutes = router;
