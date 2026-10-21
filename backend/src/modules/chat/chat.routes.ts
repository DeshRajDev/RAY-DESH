import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCouple } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../types';
import { Message } from '../../models/Message';
import { getSocketIo } from '../../sockets';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

const router = Router();

// GET messages with pagination
router.get('/messages', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coupleId = req.couple!.id;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const before = req.query.before as string | undefined;

    const query: Record<string, unknown> = {
      coupleId: new mongoose.Types.ObjectId(coupleId),
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    // Return in ascending chronological order for chat view
    return sendSuccess(res, messages.reverse().map((m: any) => m.toJSON()));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch messages';
    return sendError(res, msg, 500);
  }
});

// POST send message
router.post('/messages', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const couple = req.couple!;
    const userId = req.user!.id;
    const receiverId = couple.partner1Id.toString() === userId ? couple.partner2Id : couple.partner1Id;

    const {
      content,
      type = 'text',
      attachments = [],
      replyToId,
      replyToContent,
      replyToSenderName,
      idempotencyKey,
    } = req.body;

    // Prevent duplicate idempotent posts
    if (idempotencyKey) {
      const existing = await Message.findOne({ idempotencyKey, coupleId: couple.id });
      if (existing) {
        return sendSuccess(res, existing.toJSON());
      }
    }

    const message = await Message.create({
      coupleId: couple._id,
      senderId: new mongoose.Types.ObjectId(userId),
      receiverId: receiverId,
      content: content || '',
      type,
      attachments,
      reactions: [],
      replyToId: replyToId ? new mongoose.Types.ObjectId(replyToId) : undefined,
      replyToContent,
      replyToSenderName,
      isPinned: false,
      isFavorite: false,
      isRead: false,
      isDelivered: false,
      status: 'sent',
      idempotencyKey,
    });

    const messageJson = message.toJSON();

    const io = getSocketIo();
    if (io) {
      io.to(`couple:${couple.id}`).emit('message:new', messageJson);
    }

    // Trigger Web Push notification in background
    const { sendPushToUser } = require('../../services/push.service');
    sendPushToUser(receiverId, {
      title: req.user?.name ? `${req.user.name} • Ray` : 'Ray',
      body: type === 'image' ? '📷 Sent a photo' : type === 'video' ? '📹 Sent a video' : content || 'New message',
      url: '/chat',
      data: { messageId: messageJson.id, type: 'chat' },
    }).catch((err: any) => console.warn('Push delivery warning:', err?.message));

    return sendSuccess(res, messageJson, 'Message sent', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send message';
    return sendError(res, msg, 500);
  }
});

// PATCH edit message
router.patch('/messages/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      coupleId: req.couple!.id,
      senderId: req.user!.id,
    });

    if (!message) {
      return sendError(res, 'Message not found or unauthorized to edit', 404);
    }

    message.content = req.body.content || message.content;
    message.isEdited = true;
    await message.save();

    return sendSuccess(res, message.toJSON(), 'Message edited');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to edit message';
    return sendError(res, msg, 500);
  }
});

// DELETE message
router.delete('/messages/:id', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const message = await Message.findOneAndDelete({
      _id: req.params.id,
      coupleId: req.couple!.id,
      senderId: req.user!.id,
    });

    if (!message) {
      return sendError(res, 'Message not found or unauthorized to delete', 404);
    }

    return sendSuccess(res, { id: req.params.id }, 'Message deleted');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete message';
    return sendError(res, msg, 500);
  }
});

// POST toggle reaction
router.post('/messages/:id/react', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { emoji } = req.body;
    const userId = req.user!.id;
    const message = await Message.findOne({
      _id: req.params.id,
      coupleId: req.couple!.id,
    });

    if (!message) {
      return sendError(res, 'Message not found', 404);
    }

    const existingIndex = message.reactions.findIndex((r: any) => r.userId.toString() === userId && r.emoji === emoji);

    if (existingIndex > -1) {
      // Remove reaction if already reacted with same emoji
      message.reactions.splice(existingIndex, 1);
    } else {
      // Remove previous reaction by same user if any, then add new one
      message.reactions = message.reactions.filter((r: any) => r.userId.toString() !== userId);
      message.reactions.push({
        emoji,
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: new Date().toISOString(),
      });
    }

    await message.save();
    return sendSuccess(res, message.toJSON(), 'Reaction updated');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update reaction';
    return sendError(res, msg, 500);
  }
});

// POST toggle pin
router.post('/messages/:id/pin', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      coupleId: req.couple!.id,
    });

    if (!message) {
      return sendError(res, 'Message not found', 404);
    }

    message.isPinned = !message.isPinned;
    await message.save();

    return sendSuccess(res, message.toJSON());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle pin';
    return sendError(res, msg, 500);
  }
});

// POST mark messages as delivered
router.post('/delivered', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messageIds } = req.body;
    const query: Record<string, unknown> = {
      coupleId: req.couple!.id,
      receiverId: req.user!.id,
      isDelivered: false,
    };
    if (Array.isArray(messageIds) && messageIds.length > 0) {
      query._id = { $in: messageIds };
    }

    const now = new Date();
    await Message.updateMany(query, {
      isDelivered: true,
      status: 'delivered',
      deliveredAt: now,
    });

    const io = getSocketIo();
    if (io) {
      io.to(`couple:${req.couple!.id}`).emit('message:status', {
        messageIds: messageIds || [],
        status: 'delivered',
        deliveredAt: now.toISOString(),
      });
    }

    return sendSuccess(res, { delivered: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to mark messages delivered';
    return sendError(res, msg, 500);
  }
});

// POST mark messages as read
router.post('/read', authenticate, requireCouple, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messageIds } = req.body;
    const query: Record<string, unknown> = {
      coupleId: req.couple!.id,
      receiverId: req.user!.id,
      isRead: false,
    };
    if (Array.isArray(messageIds) && messageIds.length > 0) {
      query._id = { $in: messageIds };
    }

    const now = new Date();
    await Message.updateMany(query, {
      isRead: true,
      isDelivered: true,
      status: 'read',
      readAt: now,
    });

    const io = getSocketIo();
    if (io) {
      io.to(`couple:${req.couple!.id}`).emit('message:status', {
        messageIds: messageIds || [],
        status: 'read',
        readAt: now.toISOString(),
        readerId: req.user!.id,
      });
      io.to(`couple:${req.couple!.id}`).emit('message:read', {
        readerId: req.user!.id,
        messageIds: messageIds || [],
      });
    }

    return sendSuccess(res, { read: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to mark messages read';
    return sendError(res, msg, 500);
  }
});

export const chatRoutes = router;
