import { Response } from 'express';
import { ApiResponse, PaginatedResult } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  requestId?: string
): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    message,
    requestId,
  };
  return res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  paginated: PaginatedResult<T>,
  message?: string,
  statusCode = 200,
  requestId?: string
): Response {
  const body: ApiResponse<PaginatedResult<T>> = {
    success: true,
    data: paginated,
    message,
    requestId,
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  code = 'ERROR',
  details?: unknown,
  requestId?: string
): Response {
  const body: ApiResponse = {
    success: false,
    message,
    error: {
      code,
      details,
    },
    requestId,
  };
  return res.status(statusCode).json(body);
}
