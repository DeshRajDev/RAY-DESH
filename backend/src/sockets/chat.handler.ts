import { Server, Socket } from 'socket.io';
import { Message } from '../models/Message';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export function registerChatHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user;
  const couple = socket.data.couple;

  if (!user || !couple) return;

  const roomName = `couple:${couple.id}`;

  // Automatically mark pending undelivered messages as delivered now that recipient is online
  Message.find({ coupleId: couple.id, receiverId: user.id, isDelivered: false })
    .select('_id')
    .then(async (pending: any[]) => {
      if (pending && pending.length > 0) {
        const ids = pending.map((p: any) => p._id.toString());
        const now = new Date();
        await Message.updateMany(
          { _id: { $in: ids } },
          { isDelivered: true, status: 'delivered', deliveredAt: now }
        );
        socket.to(roomName).emit('message:status', {
          messageIds: ids,
          status: 'delivered',
          deliveredAt: now.toISOString(),
        });
      }
    })
    .catch((err: any) => logger.error({ err }, 'Failed to mark pending messages as delivered'));

  // 1. Send Message
  socket.on('message:send', async (data: any, callback?: any) => {
    try {
      const {
        content,
        type = 'text',
        attachments = [],
        replyToId,
        replyToContent,
        replyToSenderName,
        idempotencyKey,
      } = data;

      if (idempotencyKey) {
        const existing = await Message.findOne({ idempotencyKey, coupleId: couple.id });
        if (existing) {
          if (typeof callback === 'function') callback({ success: true, data: existing.toJSON() });
          return;
        }
      }

      const receiverId = couple.partner1Id.toString() === user.id ? couple.partner2Id : couple.partner1Id;

      const message = await Message.create({
        coupleId: new mongoose.Types.ObjectId(couple.id),
        senderId: new mongoose.Types.ObjectId(user.id),
        receiverId: new mongoose.Types.ObjectId(receiverId),
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

      // Broadcast to partner in the couple room
      socket.to(roomName).emit('message:new', messageJson);

      // Trigger Web Push notification in background
      const { sendPushToUser } = require('../services/push.service');
      sendPushToUser(receiverId, {
        title: user.name ? `${user.name} • Ray` : 'Ray',
        body: type === 'image' ? '📷 Sent a photo' : type === 'video' ? '📹 Sent a video' : content || 'New message',
        url: '/chat',
        data: { messageId: messageJson.id, type: 'chat' },
      }).catch((err: any) => logger.warn('Push delivery warning:', err?.message));

      if (typeof callback === 'function') {
        callback({ success: true, data: messageJson });
      }
    } catch (err) {
      logger.error({ err }, 'Socket message:send error');
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Failed to send message' });
      }
    }
  });

  // 2. Delivery Acknowledgement (Single tick -> Double grey ticks)
  socket.on('message:delivered', async (data: { messageIds?: string[]; messageId?: string }) => {
    try {
      const ids = data.messageIds || (data.messageId ? [data.messageId] : []);
      if (!ids.length) return;
      const now = new Date();
      await Message.updateMany(
        { _id: { $in: ids }, coupleId: couple.id, receiverId: user.id, isDelivered: false },
        { isDelivered: true, status: 'delivered', deliveredAt: now }
      );
      socket.to(roomName).emit('message:status', {
        messageIds: ids,
        status: 'delivered',
        deliveredAt: now.toISOString(),
      });
    } catch (err) {
      logger.error({ err }, 'Socket message:delivered error');
    }
  });

  // 3. Read Receipts (Double grey ticks -> Double blue ticks)
  socket.on('message:read', async (data?: { messageIds?: string[]; messageId?: string }) => {
    try {
      const ids = data?.messageIds || (data?.messageId ? [data.messageId] : []);
      const query: any = { coupleId: couple.id, receiverId: user.id, isRead: false };
      if (ids && ids.length > 0) {
        query._id = { $in: ids };
      }
      const now = new Date();
      await Message.updateMany(query, {
        isRead: true,
        isDelivered: true,
        status: 'read',
        readAt: now,
      });
      socket.to(roomName).emit('message:status', {
        messageIds: ids,
        status: 'read',
        readAt: now.toISOString(),
        readerId: user.id,
      });
      socket.to(roomName).emit('message:read', { readerId: user.id, messageIds: ids });
    } catch (err) {
      logger.error({ err }, 'Socket mark read error');
    }
  });

  // 4. Typing indicators
  socket.on('typing:start', () => {
    socket.to(roomName).emit('typing:start', { userId: user.id, userName: user.name });
  });

  socket.on('typing:stop', () => {
    socket.to(roomName).emit('typing:stop', { userId: user.id });
  });

  // 5. Reactions
  socket.on('message:reaction', async (data: any) => {
    try {
      const { messageId, emoji } = data;
      const message = await Message.findOne({ _id: messageId, coupleId: couple.id });
      if (!message) return;

      const existingIndex = message.reactions.findIndex(
        (r: any) => r.userId.toString() === user.id && r.emoji === emoji
      );

      if (existingIndex > -1) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions = message.reactions.filter((r: any) => r.userId.toString() !== user.id);
        message.reactions.push({
          emoji,
          userId: new mongoose.Types.ObjectId(user.id),
          timestamp: new Date().toISOString(),
        });
      }

      await message.save();
      io.to(roomName).emit('message:reaction', message.toJSON());
    } catch (err) {
      logger.error({ err }, 'Socket reaction error');
    }
  });
}
