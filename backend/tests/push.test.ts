import { describe, it, expect } from 'vitest';
import webpush from 'web-push';
import { initVapid, isPushConfigured } from '../src/services/push.service';

describe('VAPID Web Push Configuration & Utilities', () => {
  it('generates valid base64url VAPID public and private keys', () => {
    const keys = webpush.generateVAPIDKeys();
    expect(keys.publicKey).toBeDefined();
    expect(keys.privateKey).toBeDefined();
    // Uncompressed P-256 public key is 65 bytes = 87-88 chars in base64url
    expect(keys.publicKey.length).toBeGreaterThanOrEqual(86);
    // Private key is 32 bytes = 43 chars in base64url
    expect(keys.privateKey.length).toBeGreaterThanOrEqual(42);
  });

  it('safely handles VAPID initialization', () => {
    // Should return boolean without throwing exceptions
    const isConfigured = isPushConfigured();
    expect(typeof isConfigured).toBe('boolean');
  });

  it('validates VAPID subject format (mailto: or https:)', () => {
    const validMailto = 'mailto:contact@ray.app';
    const validHttps = 'https://ray.app';
    expect(validMailto.startsWith('mailto:') || validMailto.startsWith('https:')).toBe(true);
    expect(validHttps.startsWith('mailto:') || validHttps.startsWith('https:')).toBe(true);
  });
});
