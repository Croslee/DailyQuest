import { describe, it, expect } from 'vitest';
import {
  getLocalDateKey,
  parseDateKey,
  getDateRange,
  getDaysBetween,
  isToday,
  isYesterday,
  isValidDateKey,
  formatDateKey,
} from '@/utils/date';

describe('Date Utilities', () => {
  it('formats Date into YYYY-MM-DD local key', () => {
    const d = new Date(2026, 7, 30); // August 30, 2026
    expect(getLocalDateKey(d)).toBe('2026-08-30');
  });

  it('parses YYYY-MM-DD into local Date object', () => {
    const parsed = parseDateKey('2026-08-30');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(7);
    expect(parsed.getDate()).toBe(30);
  });

  it('generates inclusive date range across month boundaries', () => {
    const range = getDateRange('2026-08-30', '2026-09-02');
    expect(range).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
    ]);
  });

  it('calculates days between two dates', () => {
    expect(getDaysBetween('2026-08-01', '2026-08-31')).toBe(31);
    expect(getDaysBetween('2026-08-30', '2026-08-30')).toBe(1);
  });

  it('validates date key strings properly', () => {
    expect(isValidDateKey('2026-08-30')).toBe(true);
    expect(isValidDateKey('2026-02-30')).toBe(false); // Invalid Feb 30
    expect(isValidDateKey('invalid')).toBe(false);
  });

  it('formats date key into readable English label', () => {
    expect(formatDateKey('2026-08-30')).toBe('August 30, 2026');
  });
});
