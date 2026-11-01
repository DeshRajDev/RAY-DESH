import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendError } from '../utils/response';

export function requireCouple(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    sendError(res, 'Authentication required.', 401, 'UNAUTHORIZED', undefined, req.requestId);
    return;
  }

  if (!req.couple || !req.user.role) {
    sendError(
      res,
      'You are not currently paired in a couple sanctuary. Please join or create a couple.',
      403,
      'COUPLE_REQUIRED',
      undefined,
      req.requestId
    );
    return;
  }

  // Verify that the user is genuinely one of the 2 partners
  const p1 = (req.couple.partner1Id?._id || req.couple.partner1Id || (req.couple as any).partner1?._id || (req.couple as any).partner1 || '').toString();
  const p2 = (req.couple.partner2Id?._id || req.couple.partner2Id || (req.couple as any).partner2?._id || (req.couple as any).partner2 || '').toString();

  const isPartner1 = p1 === req.user.id;
  const isPartner2 = p2 === req.user.id;

  if (!isPartner1 && !isPartner2) {
    sendError(res, 'Forbidden: You are not a member of this couple sanctuary.', 403, 'FORBIDDEN', undefined, req.requestId);
    return;
  }

  next();
}
