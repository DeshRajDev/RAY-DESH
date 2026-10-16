export interface TimeDuration {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function calculateDuration(startDate: string | Date, toDate: Date = new Date()): TimeDuration {
  const start = new Date(startDate);
  const end = toDate;

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  let hours = end.getHours() - start.getHours();
  let minutes = end.getMinutes() - start.getMinutes();
  let seconds = end.getSeconds() - start.getSeconds();

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
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if (months < 0) {
    months += 12;
    years--;
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds),
  };
}

export function getNextOccurrence(dateStr: string | Date): Date {
  const original = new Date(dateStr);
  const now = new Date();
  const next = new Date(now.getFullYear(), original.getMonth(), original.getDate());

  if (next < now) {
    next.setFullYear(now.getFullYear() + 1);
  }
  return next;
}

export function daysUntil(dateStr: string | Date, isRecurring = false): number {
  const target = isRecurring ? getNextOccurrence(dateStr) : new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function isBirthdayToday(birthdayStr: string | Date): boolean {
  const birth = new Date(birthdayStr);
  const now = new Date();
  return birth.getMonth() === now.getMonth() && birth.getDate() === now.getDate();
}
