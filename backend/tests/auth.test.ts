/// <reference path="../../declarations.d.ts" />
/// <reference path="../declarations.d.ts" />
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/password';
import { signAccessToken, verifyAccessToken } from '../src/utils/jwt';

describe('Auth & Cryptography Utilities', () => {
  it('correctly hashes and verifies passwords with bcrypt', async () => {
    const password = 'mySecretPassword2026';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('wrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('signs and verifies JWT access tokens with couple payload', () => {
    const payload = {
      userId: 'user_123',
      coupleId: 'couple_456',
      role: 'partner1' as const,
      email: 'desh@couple.local',
    };

    const token = signAccessToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.coupleId).toBe(payload.coupleId);
    expect(decoded.role).toBe(payload.role);
  });
});
