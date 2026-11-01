import { User } from '@/types';

/**
 * Robust Centralized Identity & Author Resolution for Ray couples application.
 * Reliably maps across MongoDB ObjectIds, local roleKeys ('user_1'/'user_2'),
 * and couple partner roles ('partner1'/'partner2').
 */

export function normalizeUserId(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'object' && raw !== null) {
    if ('id' in raw && typeof (raw as any).id === 'string') return (raw as any).id.trim();
    if ('_id' in raw) return String((raw as any)._id).trim();
    if ('mongoId' in raw) return String((raw as any).mongoId).trim();
  }
  return String(raw).trim();
}

/**
 * Checks whether an identifier (ObjectId, user_1/user_2, partner1/partner2, or email/name)
 * matches the specified user.
 */
export function isUserMatch(identifier: unknown, user: User | null | undefined): boolean {
  if (!identifier || !user) return false;
  const target = normalizeUserId(identifier).toLowerCase();
  if (!target) return false;

  const myId = String(user.id || '').toLowerCase();
  const myMongoId = String((user as any).mongoId || user._id || '').toLowerCase();
  const myRole = String(user.role || '').toLowerCase();
  const myEmail = String(user.email || '').toLowerCase();
  const myLocalKey = myRole === 'partner1' ? 'user_1' : 'user_2';

  if (target === myId || (myMongoId && target === myMongoId)) return true;
  if (target === myRole || target === myLocalKey) return true;
  if (myEmail && target === myEmail) return true;

  const myName = String(user.name || '').toLowerCase();
  if (myName && target === myName) return true;
  if (myRole === 'partner2' && (target === 'ray' || target === 'rey')) return true;
  if (myRole === 'partner1' && target === 'desh') return true;

  // Partner 1 ObjectId known fallback
  if (myRole === 'partner1' && target === '6ad5228158634ec577ea3c5c') return true;
  // Partner 2 ObjectId known fallback
  if (myRole === 'partner2' && target === '6ad5228158634ec577ea3c61') return true;

  return false;
}

/**
 * Checks if the target author/sender/commenter identifier belongs to the currently authenticated user.
 */
export function isCurrentUser(identifier: unknown, currentUser: User | null | undefined): boolean {
  return isUserMatch(identifier, currentUser);
}

/**
 * Resolves the author object (either currentUser or partnerUser) based on the identifier.
 */
export function resolveAuthor(
  identifier: unknown,
  currentUser: User,
  partnerUser: User
): User {
  if (isCurrentUser(identifier, currentUser)) {
    return currentUser;
  }
  return partnerUser;
}

/**
 * Resolves the proper display name for an author/sender/commenter.
 */
export function resolveAuthorName(
  identifier: unknown,
  currentUser: User,
  partnerUser: User,
  fallbackName?: string
): string {
  const author = resolveAuthor(identifier, currentUser, partnerUser);
  return author.name || fallbackName || (author.role === 'partner1' ? 'Desh' : 'Ray');
}

/**
 * Resolves the proper display avatar for an author/sender/commenter.
 */
export function resolveAuthorAvatar(
  identifier: unknown,
  currentUser: User,
  partnerUser: User,
  fallbackAvatar?: string
): string {
  const author = resolveAuthor(identifier, currentUser, partnerUser);
  return author.avatar || fallbackAvatar || '';
}
