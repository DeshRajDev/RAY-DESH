import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Story } from '../../models/Story';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET active stories
router.get('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stories = await Story.find({
      coupleId: req.couple!.id,
      expiresAt: { $gt: new Date() },
      isArchived: false,
    }).sort({ createdAt: 1 });

    return sendSuccess(res, stories.map((s: any) => s.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch stories';
    return sendError(res, msg, 500);
  }
});

// POST create story
router.post('/', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type = 'image', mediaUrl, text, backgroundColor, songTitle, songArtist, caption } = req.body;

    const story = await Story.create({
      coupleId: new mongoose.Types.ObjectId(req.couple!.id),
      authorId: new mongoose.Types.ObjectId(req.user!.id),
      type,
      mediaUrl,
      text,
      backgroundColor: backgroundColor || '#111111',
      songTitle,
      songArtist,
      caption,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      reactions: [],
      replies: [],
      isArchived: false,
    });

    return sendSuccess(res, story.toJSON(), 'Story posted', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to post story';
    return sendError(res, msg, 500);
  }
});

// POST react to story
router.post('/:id/react', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { emoji } = req.body;
    const userId = req.user!.id;
    const story = await Story.findOne({ _id: req.params.id, coupleId: req.couple!.id });

    if (!story) return sendError(res, 'Story not found', 404);

    story.reactions = story.reactions.filter((r: any) => r.userId.toString() !== userId);
    story.reactions.push({
      emoji,
      userId: new mongoose.Types.ObjectId(userId),
    });

    await story.save();
    return sendSuccess(res, story.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to react to story';
    return sendError(res, msg, 500);
  }
});

// POST reply to story
router.post('/:id/reply', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text } = req.body;
    const userId = req.user!.id;
    const story = await Story.findOne({ _id: req.params.id, coupleId: req.couple!.id });

    if (!story) return sendError(res, 'Story not found', 404);

    story.replies.push({
      userId: new mongoose.Types.ObjectId(userId),
      text,
      createdAt: new Date().toISOString(),
    });

    await story.save();
    return sendSuccess(res, story.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reply to story';
    return sendError(res, msg, 500);
  }
});

export const storyRoutes = router;
