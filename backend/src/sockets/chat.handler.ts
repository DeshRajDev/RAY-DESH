import { Server, Socket } from 'socket.io';
import { Message } from '../models/Message';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export function registerChatHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user;
  const couple = socket.data.couple;

  if (!user || !couple) return;

  const roomName = `couple:${couple.id}`;

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
        isDelivered: true,
        idempotencyKey,
      });

      const messageJson = message.toJSON();

      // Broadcast to partner in the couple room
      socket.to(roomName).emit('message:new', messageJson);

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

  // 2. Typing indicators
  socket.on('typing:start', () => {
    socket.to(roomName).emit('typing:start', { userId: user.id, userName: user.name });
  });

  socket.on('typing:stop', () => {
    socket.to(roomName).emit('typing:stop', { userId: user.id });
  });

  // 3. Reactions
  socket.on('message:reaction', async (data: any) => {
    try {
      const { messageId, emoji } = data;
      const message = await Message.findOne({ _id: messageId, coupleId: couple.id });
      if (!message) return;

      const existingIndex = message.reactions.findIndex((r: any) => r.userId.toString() === user.id && r.emoji === emoji);

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

  // 4. Read receipts
  socket.on('message:read', async () => {
    try {
      await Message.updateMany(
        { coupleId: couple.id, receiverId: user.id, isRead: false },
        { isRead: true }
      );
      socket.to(roomName).emit('message:read', { readerId: user.id });
    } catch (err) {
      logger.error({ err }, 'Socket mark read error');
    }
  });
}
