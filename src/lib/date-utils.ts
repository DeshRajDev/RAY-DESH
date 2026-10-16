export interface TimeDuration {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds?: number;
  totalDays: number;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalSeconds: number;
}

/**
 * Calculates relationship duration from a start date until now.
 */
export function calculateRelationshipDuration(startDateStr: string, currentDate: Date = new Date()): TimeDuration {
  const start = new Date(startDateStr);
  const now = currentDate;

  if (isNaN(start.getTime())) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 };
  }

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  let hours = now.getHours() - start.getHours();
  let minutes = now.getMinutes() - start.getMinutes();
  let seconds = now.getSeconds() - start.getSeconds();
  const milliseconds = now.getMilliseconds();

  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }
  if (minutes < 0) {
    minutes += 60;
    hours--;
  }
  if (hours < 0) {
    hours += 24;
    days--;
  }
  if (days < 0) {
    // Get days in previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if (months < 0) {
    months += 12;
    years--;
  }

  const diffMs = Math.max(0, now.getTime() - start.getTime());
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds),
    milliseconds,
    totalDays
  };
}

/**
 * Gets next yearly occurrence of a date (e.g. birthday, anniversary)
 */
export function getNextOccurrence(dateStr: string, fromDate: Date = new Date()): Date {
  const original = new Date(dateStr);
  const now = fromDate;
  
  const thisYearOccurrence = new Date(now.getFullYear(), original.getMonth(), original.getDate(), 0, 0, 0);
  
  // If this year's date has already passed today
  const todayReset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  
  if (thisYearOccurrence.getTime() < todayReset.getTime()) {
    return new Date(now.getFullYear() + 1, original.getMonth(), original.getDate(), 0, 0, 0);
  }
  return thisYearOccurrence;
}

/**
 * Calculates countdown until a target date
 */
export function timeUntil(targetDateStr: string, isRecurring: boolean = false): CountdownTime {
  const target = isRecurring 
    ? getNextOccurrence(targetDateStr)
    : new Date(targetDateStr);
  const now = new Date();

  const diffMs = target.getTime() - now.getTime();
  const isPast = diffMs <= 0;
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isPast, totalSeconds };
}

/**
 * Number of days until a date
 */
export function daysUntil(targetDateStr: string, isRecurring: boolean = false): number {
  const countdown = timeUntil(targetDateStr, isRecurring);
  return countdown.days;
}

/**
 * Checks if target date matches today's month and day (e.g., is birthday today)
 */
export function isBirthdayToday(birthdayDateStr: string, checkDate: Date = new Date()): boolean {
  if (!birthdayDateStr) return false;
  const bday = new Date(birthdayDateStr);
  return (
    bday.getMonth() === checkDate.getMonth() &&
    bday.getDate() === checkDate.getDate()
  );
}

/**
 * Checks if a special date is today
 */
export function isSpecialDateToday(dateStr: string, isRecurring: boolean = true): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  if (isRecurring) {
    return date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  }
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/**
 * Format date nicely
 */
export function formatDate(dateStr: string, formatStyle: 'short' | 'medium' | 'long' | 'relative' = 'medium'): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  if (formatStyle === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (formatStyle === 'medium') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (formatStyle === 'long') {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  // relative
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export interface TimeOfDayGreeting {
  greeting: string;
  emoji: string;
  subtext: string;
}

/**
 * Returns dynamic time-of-day greeting (Morning, Afternoon, Evening, Night) based on local time.
 */
export function getTimeOfDayGreeting(date: Date = new Date()): TimeOfDayGreeting {
  const hours = date.getHours(); // Local 0-23

  if (hours >= 5 && hours < 12) {
    return {
      greeting: 'Good morning',
      emoji: '☀️',
      subtext: 'A brand new day to love and cherish each other',
    };
  } else if (hours >= 12 && hours < 17) {
    return {
      greeting: 'Good afternoon',
      emoji: '🌤️',
      subtext: 'Hope your day is going beautifully my love',
    };
  } else if (hours >= 17 && hours < 21) {
    return {
      greeting: 'Good evening',
      emoji: '🌇',
      subtext: 'Unwinding and thinking of you as the stars begin to glow',
    };
  } else {
    return {
      greeting: 'Good night',
      emoji: '🌙',
      subtext: 'Rest softly under the starlight, always dreaming of you',
    };
  }
}
