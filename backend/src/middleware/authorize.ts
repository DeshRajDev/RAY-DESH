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
  const isPartner1 = req.couple.partner1Id.toString() === req.user.id;
  const isPartner2 = req.couple.partner2Id.toString() === req.user.id;

  if (!isPartner1 && !isPartner2) {
    sendError(res, 'Forbidden: You are not a member of this couple sanctuary.', 403, 'FORBIDDEN', undefined, req.requestId);
    return;
  }

  next();
}
