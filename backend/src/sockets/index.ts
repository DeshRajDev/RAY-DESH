import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { Couple } from '../models/Couple';
import { corsOptions } from '../config/cors';
import { logger } from '../utils/logger';
import { registerChatHandlers } from './chat.handler';

let ioInstance: Server | null = null;
const userSocketsMap = new Map<string, Set<string>>();

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

    // Track multi-session active sockets per user
    if (!userSocketsMap.has(user.id)) {
      userSocketsMap.set(user.id, new Set());
    }
    const sockets = userSocketsMap.get(user.id)!;
    const isFirstConnection = sockets.size === 0;
    sockets.add(socket.id);

    logger.info(`🔌 User connected to socket: ${user.name} (${user.id}) [active sessions: ${sockets.size}] joined ${roomName}`);

    if (isFirstConnection) {
      const now = new Date();
      await User.findByIdAndUpdate(user.id, {
        isOnline: true,
        lastHeartbeatAt: now,
      });
      socket.to(roomName).emit('presence:update', {
        userId: user.id,
        isOnline: true,
        lastSeen: 'Online now',
        lastSeenAt: now.toISOString(),
      });
    }

    // Handle presence heartbeat from client
    socket.on('presence:heartbeat', async () => {
      const now = new Date();
      await User.findByIdAndUpdate(user.id, { lastHeartbeatAt: now });
    });

    // Register modular feature handlers
    registerChatHandlers(io, socket);

    socket.on('disconnect', async () => {
      const userSockets = userSocketsMap.get(user.id);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketsMap.delete(user.id);
          const lastSeenAt = new Date();
          await User.findByIdAndUpdate(user.id, {
            isOnline: false,
            lastSeenAt,
            lastSeen: lastSeenAt.toISOString(),
          });
          logger.info(`🔌 User went offline: ${user.name} (${user.id})`);
          socket.to(roomName).emit('presence:update', {
            userId: user.id,
            isOnline: false,
            lastSeen: lastSeenAt.toISOString(),
            lastSeenAt: lastSeenAt.toISOString(),
          });
        } else {
          logger.info(`🔌 User disconnected one session: ${user.name} (${user.id}) [remaining: ${userSockets.size}]`);
        }
      }
    });
  });

  return io;
}
