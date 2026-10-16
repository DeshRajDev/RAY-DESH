import http from 'http';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { initializeSockets } from './sockets';
import { startScheduledJobs } from './jobs/scheduler';
import { env } from './config/env';
import { logger } from './utils/logger';

async function startServer() {
  try {
    const app = createApp();
    const server = http.createServer(app as any);

    // Initialize WebSockets
    initializeSockets(server);

    // Connect to MongoDB
    await connectDatabase();

    // Start background schedulers
    startScheduledJobs();

    server.listen(env.PORT, () => {
      logger.info(`✨ Desh & Rey Private Couple Sanctuary API running on http://localhost:${env.PORT}`);
      logger.info(`🌐 Health check available at: http://localhost:${env.PORT}/health`);
      logger.info(`📡 API v1 root endpoint at: http://localhost:${env.PORT}/api/v1`);
    });

    // Graceful Shutdown Handlers
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
