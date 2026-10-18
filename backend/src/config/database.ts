import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err: any) => {
      logger.error(`MongoDB connection error: ${err.message || String(err)}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnection...');
    });

    return conn;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Failed to connect to MongoDB: ${msg}`);
    logger.warn('⚠️ If running without a local MongoDB instance, please configure MONGODB_URI in backend/.env');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB connection closed.');
}
