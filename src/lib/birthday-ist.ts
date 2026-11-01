/**
 * Asia/Kolkata (IST) authoritative date/time utilities for frontend.
 * IST is strictly UTC + 05:30 (330 minutes) all year round without daylight savings.
 */

import { ApiClient } from '@/services/api/client';

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export interface BirthdayISTStatus {
  currentTimeIST: string;
  serverTimeUtc: string;
  isBeforeMidnight: boolean;
  isBirthdayActive: boolean;
  isPastCelebration: boolean;
  msUntilMidnight: number;
  celebrationDateIST: string;
}

/**
 * Calculates current date/time converted to Asia/Kolkata (IST).
 */
export function getNowInIST(referenceDate: Date = new Date()): Date {
  const utcMs = referenceDate.getTime() + (referenceDate.getTimezoneOffset() * 60000);
  return new Date(utcMs + IST_OFFSET_MS);
}

/**
 * Calculates whether Ray's birthday (November 1 to November 2, 2026) is active in IST.
 * Start: 2026-11-01 00:00:00.000 IST
 * End:   2026-11-02 23:59:59.999 IST
 * Expires automatically after: 2026-11-02 11:59:59 PM IST (at Nov 3, 2026 00:00:00 IST)
 */
export function calculateLocalISTBirthdayStatus(referenceDate: Date = new Date()): BirthdayISTStatus {
  const nowIST = getNowInIST(referenceDate);

  // Month 10 is November in JavaScript Date (0-indexed)
  const bdayStartIST = new Date(2026, 10, 1, 0, 0, 0, 0);
  const bdayEndIST = new Date(2026, 10, 2, 23, 59, 59, 999);

  const nowMs = nowIST.getTime();
  const startMs = bdayStartIST.getTime();
  const endMs = bdayEndIST.getTime();

  const isBeforeMidnight = nowMs < startMs;
  const isBirthdayActive = nowMs >= startMs && nowMs <= endMs;
  const isPastCelebration = nowMs > endMs;
  const msUntilMidnight = Math.max(0, startMs - nowMs);

  return {
    currentTimeIST: nowIST.toISOString(),
    serverTimeUtc: referenceDate.toISOString(),
    isBeforeMidnight,
    isBirthdayActive,
    isPastCelebration,
    msUntilMidnight,
    celebrationDateIST: '2026-11-01 to 2026-11-02',
  };
}

/**
 * Fetches authoritative IST status from backend, with local IST calculation fallback.
 */
export async function fetchAuthoritativeBirthdayStatus(): Promise<BirthdayISTStatus> {
  try {
    const api = ApiClient.getInstance();
    const res = await api.get<{ success: boolean; data: BirthdayISTStatus }>('/birthdays/status');
    if (res && res.data) {
      return res.data;
    }
  } catch {
    // Graceful fallback to local calculation if server is starting or offline
  }
  return calculateLocalISTBirthdayStatus();
}

/**
 * Timer listener to detect midnight transition automatically.
 * Calls onMidnight when transition occurs.
 */
export function watchForMidnightTransition(
  onMidnight: () => void,
  intervalMs: number = 1000
): () => void {
  let wasBefore = calculateLocalISTBirthdayStatus().isBeforeMidnight;

  const timer = setInterval(() => {
    const status = calculateLocalISTBirthdayStatus();
    if (wasBefore && !status.isBeforeMidnight && status.isBirthdayActive) {
      wasBefore = false;
      onMidnight();
    }
  }, intervalMs);

  return () => clearInterval(timer);
}
