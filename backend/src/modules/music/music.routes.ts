import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Song } from '../../models/Song';
import { Favorite } from '../../models/Favorite';
import { youtubeService } from './youtube.service';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET favorite songs (most recently favorited first)
router.get('/favorites', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const songs = await Song.find({
      coupleId: req.couple!.id,
      isFavorite: true,
    }).sort({ updatedAt: -1, createdAt: -1 });

    return sendSuccess(res, songs.map((s: any) => s.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch favorite songs';
    return sendError(res, msg, 500);
  }
});

// POST toggle song favorite (handles both existing Sanctuary songs and YouTube searched tracks)
router.post('/favorite-toggle', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { songId, providerTrackId, title, artist, coverUrl, duration = 180, provider = 'youtube', shareUrl } = req.body;
    const coupleId = req.couple!.id;
    const userId = req.user!.id;

    let song = null;

    if (songId && mongoose.Types.ObjectId.isValid(songId)) {
      song = await Song.findOne({ _id: songId, coupleId });
    }

    if (!song && providerTrackId) {
      song = await Song.findOne({ providerTrackId, coupleId });
    }

    if (song) {
      song.isFavorite = !song.isFavorite;
      await song.save();

      if (song.isFavorite) {
        await Favorite.findOneAndUpdate(
          { coupleId, userId, resourceType: 'song', resourceId: song._id.toString() },
          { coupleId, userId, resourceType: 'song', resourceId: song._id.toString() },
          { upsert: true }
        );
      } else {
        await Favorite.findOneAndDelete({
          coupleId,
          userId,
          resourceType: 'song',
          resourceId: song._id.toString(),
        });
      }

      return sendSuccess(res, song.toJSON(), song.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    }

    // If song does not exist in DB yet (e.g. newly favorited from YouTube search)
    if (!title || !providerTrackId) {
      return sendError(res, 'Song metadata required to favorite track', 400);
    }

    const newSong = await Song.create({
      coupleId: new mongoose.Types.ObjectId(coupleId),
      title: title.trim(),
      artist: (artist || 'YouTube Artist').trim(),
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      audioUrl: `https://www.youtube.com/embed/${providerTrackId}`,
      duration: duration || 180,
      addedById: new mongoose.Types.ObjectId(userId),
      addedByName: req.user!.name || 'Sanctuary',
      category: 'Our Songs',
      isFavorite: true,
      playCount: 0,
      provider: provider || 'youtube',
      providerTrackId,
      shareUrl: shareUrl || `https://www.youtube.com/watch?v=${providerTrackId}`,
    });

    await Favorite.create({
      coupleId: new mongoose.Types.ObjectId(coupleId),
      userId: new mongoose.Types.ObjectId(userId),
      resourceType: 'song',
      resourceId: newSong._id.toString(),
    });

    return sendSuccess(res, newSong.toJSON(), 'Added to favorites', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle favorite';
    return sendError(res, msg, 500);
  }
});

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

// GET search YouTube music videos
router.get('/search', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) {
      return sendSuccess(res, { tracks: [] }, 'Empty query provided');
    }

    if (!youtubeService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'YouTube Data API key is not configured on the server. Please set YOUTUBE_API_KEY in your environment.',
        error: { code: 'YOUTUBE_NOT_CONFIGURED' },
      });
    }

    const limit = Math.min(Math.max(1, parseInt(String(req.query.limit || 20), 10) || 20), 50);
    const pageToken = typeof req.query.pageToken === 'string' ? req.query.pageToken : undefined;
    const regionCode = typeof req.query.regionCode === 'string' ? req.query.regionCode : 'IN';

    const result = await youtubeService.searchVideos(query, limit, pageToken, regionCode);
    return sendSuccess(res, result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'YouTube search failed';
    const status = (err as any).statusCode || 500;
    const code = (err as any).code || 'YOUTUBE_SEARCH_ERROR';
    return res.status(status).json({
      success: false,
      message: msg,
      error: { code },
    });
  }
});

// GET trending music videos (default: India)
router.get('/trending', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!youtubeService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'YouTube Data API key is not configured on the server. Please set YOUTUBE_API_KEY in your environment.',
        error: { code: 'YOUTUBE_NOT_CONFIGURED' },
      });
    }

    const limit = Math.min(Math.max(1, parseInt(String(req.query.limit || 20), 10) || 20), 50);
    const regionCode = typeof req.query.regionCode === 'string' ? req.query.regionCode : 'IN';

    const tracks = await youtubeService.getTrendingMusic(regionCode, limit);
    return sendSuccess(res, tracks);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch trending music';
    const status = (err as any).statusCode || 500;
    const code = (err as any).code || 'YOUTUBE_TRENDING_ERROR';
    return res.status(status).json({
      success: false,
      message: msg,
      error: { code },
    });
  }
});

// GET single YouTube video details
router.get('/videos/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!youtubeService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'YouTube Data API key is not configured on the server. Please set YOUTUBE_API_KEY in your environment.',
        error: { code: 'YOUTUBE_NOT_CONFIGURED' },
      });
    }

    const track = await youtubeService.getVideoDetails(req.params.id);
    if (!track) {
      return sendError(res, 'Video not found on YouTube', 404);
    }
    return sendSuccess(res, track);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve video metadata';
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
