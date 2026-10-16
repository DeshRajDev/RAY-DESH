import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const reqId = (req as AuthenticatedRequest).requestId;

  logger.error({
    message: err.message,
    stack: err.stack,
    requestId: reqId,
    path: req.path,
    method: req.method,
  });

  const details = env.NODE_ENV === 'development' ? err.stack : undefined;

  sendError(
    res,
    err.message || 'Internal Server Error',
    500,
    'INTERNAL_SERVER_ERROR',
    details,
    reqId
  );
}
