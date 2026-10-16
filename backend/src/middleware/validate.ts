import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export function validate(schema: ZodType<any>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue: any) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        sendError(
          res,
          'Validation failed. Please check your request parameters.',
          400,
          'VALIDATION_ERROR',
          issues,
          (req as AuthenticatedRequest).requestId
        );
        return;
      }
      next(error);
    }
  };
}
