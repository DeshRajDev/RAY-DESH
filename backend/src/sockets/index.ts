import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { Couple } from '../models/Couple';
import { corsOptions } from '../config/cors';
import { logger } from '../utils/logger';
import { registerChatHandlers } from './chat.handler';

let ioInstance: Server | null = null;

export function getSocketIo(): Server | null {
  return ioInstance;
}

export function initializeSockets(server: HttpServer): Server {
  const io = new Server(server, {
    cors: corsOptions,
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  ioInstance = io;

  // Socket Authentication Handshake Middleware
  io.use(async (socket: Socket, next: (err?: any) => void) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Socket authentication error: Token missing'));
      }

      const payload = verifyAccessToken(token);
      if (!payload || !payload.userId) {
        return next(new Error('Socket authentication error: Invalid token'));
      }

      const user = await User.findById(payload.userId);
      if (!user) {
        return next(new Error('Socket authentication error: User not found'));
      }

      socket.data.user = {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      };

      if (user.coupleId) {
        const couple = await Couple.findById(user.coupleId);
        if (couple) {
          socket.data.couple = {
            id: couple._id.toString(),
            partner1Id: couple.partner1.toString(),
            partner2Id: couple.partner2.toString(),
          };
        }
      }

      next();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Auth error';
      next(new Error(`Socket authentication error: ${msg}`));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user;
    const couple = socket.data.couple;

    if (!user || !couple) {
      socket.disconnect(true);
      return;
    }

    const roomName = `couple:${couple.id}`;
    await socket.join(roomName);

    logger.info(`🔌 User connected to socket: ${user.name} (${user.id}) joined ${roomName}`);

    // Update online presence
    await User.findByIdAndUpdate(user.id, { isOnline: true, lastSeen: 'Active just now' });
    socket.to(roomName).emit('presence:update', { userId: user.id, isOnline: true, lastSeen: 'Active just now' });

    // Register modular feature handlers
    registerChatHandlers(io, socket);

    socket.on('disconnect', async () => {
      logger.info(`🔌 User disconnected: ${user.name} (${user.id})`);
      const lastSeen = new Date().toISOString();
      await User.findByIdAndUpdate(user.id, { isOnline: false, lastSeen });
      socket.to(roomName).emit('presence:update', { userId: user.id, isOnline: false, lastSeen });
    });
  });

  return io;
}
