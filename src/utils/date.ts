/**
 * Centralized date utility functions.
 * All daily logic uses the user's local timezone.
 * Date keys use YYYY-MM-DD format.
 */

/** Get today's date as a YYYY-MM-DD string in local timezone */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Check if a date key represents today */
export function isToday(dateKey: string): boolean {
  return dateKey === getLocalDateKey();
}

/** Check if a date key represents yesterday */
export function isYesterday(dateKey: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateKey === getLocalDateKey(yesterday);
}

/** Parse a YYYY-MM-DD date key into a Date object (local timezone, midnight) */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Get previous date key (1 day before) */
export function getPreviousDateKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - 1);
  return getLocalDateKey(date);
}

/** Get next date key (1 day after) */
export function getNextDateKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + 1);
  return getLocalDateKey(date);
}

/** Get an array of date keys for a range (inclusive) */
export function getDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = parseDateKey(from);
  const end = parseDateKey(to);

  while (current <= end) {
    dates.push(getLocalDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/** Get the number of days between two date keys (inclusive) */
export function getDaysBetween(from: string, to: string): number {
  const fromDate = parseDateKey(from);
  const toDate = parseDateKey(to);
  const diffMs = toDate.getTime() - fromDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/** Get the date key for N days ago */
export function daysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return getLocalDateKey(date);
}

/** Get the date key for tomorrow */
export function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return getLocalDateKey(date);
}

/** Get the date key for N days from now */
export function daysFromNow(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return getLocalDateKey(date);
}

/** Get the start of the current week (Monday) as a date key */
export function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  return getLocalDateKey(monday);
}

/** Get the start of the current month as a date key */
export function getMonthStart(): string {
  const now = new Date();
  return getLocalDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
}

/** Get the end of the current month as a date key */
export function getMonthEnd(): string {
  const now = new Date();
  return getLocalDateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

/** Format a date key for display (e.g., "August 30, 2026") */
export function formatDateKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Format a date key for short display (e.g., "Aug 30") */
export function formatDateKeyShort(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Get the day of week name from a date key */
export function getDayOfWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/** Get current ISO timestamp */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Check if a string is a valid YYYY-MM-DD date key */
export function isValidDateKey(dateKey: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const date = parseDateKey(dateKey);
  return !isNaN(date.getTime()) && getLocalDateKey(date) === dateKey;
}

/** Get date key for the start of the year (approximately 365 days ago) for contribution chart */
export function getOneYearAgo(): string {
  return daysAgo(364);
}
