import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Song } from '../../models/Song';
import { jamendoService } from './jamendo.service';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET all sanctuary songs
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const songs = await Song.find({ coupleId: req.couple!.id }).sort({ isFavorite: -1, createdAt: -1 });
    return sendSuccess(res, songs.map((s: any) => s.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch songs';
    return sendError(res, msg, 500);
  }
});

// GET search Jamendo tracks
router.get('/search', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) {
      return sendSuccess(res, [], 'Empty query provided');
    }

    if (!jamendoService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Jamendo API client ID is not configured on the server. Please set JAMENDO_CLIENT_ID in your environment.',
        error: { code: 'JAMENDO_NOT_CONFIGURED' },
      });
    }

    const limit = Math.min(Math.max(1, parseInt(String(req.query.limit || 20), 10) || 20), 50);
    const offset = Math.max(0, parseInt(String(req.query.offset || 0), 10) || 0);

    const tracks = await jamendoService.searchTracks(query, limit, offset);
    return sendSuccess(res, tracks);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Jamendo search failed';
    const status = (err as any).statusCode || 500;
    return sendError(res, msg, status);
  }
});

// GET featured Jamendo tracks for discovery
router.get('/featured', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!jamendoService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Jamendo API client ID is not configured on the server. Please set JAMENDO_CLIENT_ID in your environment.',
        error: { code: 'JAMENDO_NOT_CONFIGURED' },
      });
    }

    const limit = Math.min(Math.max(1, parseInt(String(req.query.limit || 20), 10) || 20), 50);
    const tracks = await jamendoService.getFeaturedTracks(limit);
    return sendSuccess(res, tracks);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch featured tracks';
    const status = (err as any).statusCode || 500;
    return sendError(res, msg, status);
  }
});

// GET single Jamendo track details
router.get('/tracks/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!jamendoService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Jamendo API client ID is not configured on the server. Please set JAMENDO_CLIENT_ID in your environment.',
        error: { code: 'JAMENDO_NOT_CONFIGURED' },
      });
    }

    const track = await jamendoService.getTrackById(req.params.id);
    if (!track) {
      return sendError(res, 'Track not found on Jamendo', 404);
    }
    return sendSuccess(res, track);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve track metadata';
    const status = (err as any).statusCode || 500;
    return sendError(res, msg, status);
  }
});

// POST add song
router.post('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      artist,
      album,
      coverUrl,
      audioUrl,
      duration = 180,
      spotifyUrl,
      category = 'Our Songs',
      addedByName,
      lyricsSnippet,
      note,
      provider = 'custom',
      providerTrackId,
      licenseUrl,
      shareUrl,
    } = req.body;

    const song = await Song.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      title,
      artist,
      album,
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      audioUrl,
      duration,
      spotifyUrl,
      addedById: new mongoose.Types.ObjectId(req.user!.id),
      addedByName: addedByName || req.user!.name || 'Sanctuary',
      category,
      lyricsSnippet,
      note,
      isFavorite: false,
      playCount: 0,
      provider,
      providerTrackId,
      licenseUrl,
      shareUrl,
    });

    return sendSuccess(res, song.toJSON(), 'Song added', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add song';
    return sendError(res, msg, 500);
  }
});

// POST toggle song favorite
router.post('/:id/favorite', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const song = await Song.findOne({ _id: req.params.id, coupleId: req.couple!.id });
    if (!song) return sendError(res, 'Song not found', 404);

    song.isFavorite = !song.isFavorite;
    await song.save();

    return sendSuccess(res, song.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to favorite song';
    return sendError(res, msg, 500);
  }
});

// POST record play
router.post('/:id/play', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const song = await Song.findOneAndUpdate(
      { _id: req.params.id, coupleId: req.couple!.id },
      { $inc: { playCount: 1 } },
      { new: true }
    );
    if (!song) return sendError(res, 'Song not found', 404);
    return sendSuccess(res, song.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update play count';
    return sendError(res, msg, 500);
  }
});

// DELETE song
router.delete('/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const song = await Song.findOneAndDelete({ _id: req.params.id, coupleId: req.couple!.id });
    if (!song) return sendError(res, 'Song not found', 404);
    return sendSuccess(res, { id: req.params.id }, 'Song removed');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete song';
    return sendError(res, msg, 500);
  }
});

export const musicRoutes = router;
