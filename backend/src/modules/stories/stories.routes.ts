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
    const { 
      type = 'image', 
      mediaUrl, 
      text, 
      backgroundColor, 
      songTitle, 
      songArtist, 
      caption,
      durationSeconds = 15,
      textOverlays = []
    } = req.body;

    const validatedDuration = Math.max(15, Math.min(Number(durationSeconds) || 15, 45));

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
      durationSeconds: validatedDuration,
      textOverlays,
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

    // Trigger push notification to story author if not self
    if (story.authorId.toString() !== userId) {
      const { sendPushToUser } = require('../../services/push.service');
      sendPushToUser(story.authorId, {
        title: 'Ray',
        body: `${req.user?.name || 'Your partner'} reacted ${emoji} to your story!`,
        url: '/stories',
      }).catch(() => {});
    }

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
    const couple = req.couple!;
    const story = await Story.findOne({ _id: req.params.id, coupleId: couple.id });

    if (!story) return sendError(res, 'Story not found', 404);

    story.replies.push({
      userId: new mongoose.Types.ObjectId(userId),
      text,
      createdAt: new Date().toISOString(),
    });

    await story.save();

    // Create a real Message in the couple chat linking this story
    const { Message } = require('../../models/Message');
    const { getSocketIo } = require('../../sockets');
    const receiverId = story.authorId;

    const chatMsg = await Message.create({
      coupleId: new mongoose.Types.ObjectId(couple.id),
      senderId: new mongoose.Types.ObjectId(userId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      content: text,
      type: 'story_reply',
      storyReference: {
        storyId: story._id.toString(),
        mediaUrl: story.mediaUrl || '',
        caption: story.caption || story.text || 'Shared Story',
      },
      status: 'sent',
      isDelivered: false,
      isRead: false,
    });

    const msgJson = chatMsg.toJSON();
    const io = getSocketIo();
    if (io) {
      io.to(`couple:${couple.id}`).emit('message:new', msgJson);
    }

    // Trigger push notification
    if (story.authorId.toString() !== userId) {
      const { sendPushToUser } = require('../../services/push.service');
      sendPushToUser(story.authorId, {
        title: req.user?.name ? `${req.user.name} • Ray` : 'Ray',
        body: `Replied to your story: "${text}"`,
        url: '/chat',
      }).catch(() => {});
    }

    return sendSuccess(res, { story: story.toJSON(), message: msgJson });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reply to story';
    return sendError(res, msg, 500);
  }
});

export const storyRoutes = router;
