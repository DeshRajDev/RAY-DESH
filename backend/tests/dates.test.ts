/// <reference path="../../declarations.d.ts" />
/// <reference path="../declarations.d.ts" />
import { describe, it, expect } from 'vitest';
import { calculateDuration, getNextOccurrence, daysUntil, isBirthdayToday } from '../src/utils/date-calculator';

describe('Date & Anniversary Calculations', () => {
  it('correctly calculates relationship duration from Sep 27, 2026', () => {
    const startDate = '2026-09-27T00:00:00.000Z';
    const futureDate = new Date('2026-10-27T00:00:00.000Z');
    const duration = calculateDuration(startDate, futureDate);

    expect(duration.months).toBe(1);
    expect(duration.days).toBe(0);
  });

  it('correctly calculates next occurrence for annual anniversaries and birthdays', () => {
    const birthday = '2005-11-01T00:00:00.000Z';
    const next = getNextOccurrence(birthday);
    expect(next.getMonth()).toBe(10); // November (0-indexed 10)
    expect(next.getDate()).toBe(1);
  });

  it('returns true when birthday matches current month and day', () => {
    const now = new Date();
    const todayBirthday = new Date(2004, now.getMonth(), now.getDate()).toISOString();
    expect(isBirthdayToday(todayBirthday)).toBe(true);
  });
});
