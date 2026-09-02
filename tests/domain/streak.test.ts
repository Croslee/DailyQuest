import { describe, it, expect } from 'vitest';
import { calculateStreak } from '@/domain/streak';
import type { DailyStats } from '@/types/statistics';

function makeStat(date: string, isSuccessful: boolean, total = 5, skipped = 0): DailyStats {
  return {
    date,
    totalQuests: total,
    completed: isSuccessful ? 4 : 1,
    skipped,
    missed: isSuccessful ? 1 : 4,
    pending: 0,
    score: isSuccessful ? 80 : 20,
    xpEarned: isSuccessful ? 80 : 20,
    isSuccessful,
  };
}

describe('calculateStreak', () => {
  it('returns 0 for empty history', () => {
    const res = calculateStreak([]);
    expect(res.currentStreak).toBe(0);
    expect(res.bestStreak).toBe(0);
    expect(res.successfulDays).toBe(0);
  });

  it('calculates 1 day streak for first successful day', () => {
    const stats = [makeStat('2026-08-30', true)];
    const res = calculateStreak(stats, '2026-08-30');
    expect(res.currentStreak).toBe(1);
    expect(res.bestStreak).toBe(1);
    expect(res.successfulDays).toBe(1);
  });

  it('calculates consecutive successful days', () => {
    const stats = [
      makeStat('2026-08-27', true),
      makeStat('2026-08-28', true),
      makeStat('2026-08-29', true),
      makeStat('2026-08-30', true),
    ];
    const res = calculateStreak(stats, '2026-08-30');
    expect(res.currentStreak).toBe(4);
    expect(res.bestStreak).toBe(4);
    expect(res.successfulDays).toBe(4);
  });

  it('breaks streak when a day fails (<70%)', () => {
    const stats = [
      makeStat('2026-08-25', true),
      makeStat('2026-08-26', true),
      makeStat('2026-08-27', true),
      makeStat('2026-08-28', false), // Broke streak
      makeStat('2026-08-29', true),
      makeStat('2026-08-30', true),
    ];
    const res = calculateStreak(stats, '2026-08-30');
    expect(res.currentStreak).toBe(2);
    expect(res.bestStreak).toBe(3);
    expect(res.successfulDays).toBe(5);
  });

  it('does not break streak on skipped-only days', () => {
    const stats = [
      makeStat('2026-08-27', true),
      makeStat('2026-08-28', true),
      makeStat('2026-08-29', false, 2, 2), // 2 quests, 2 skipped -> 0 actionable
      makeStat('2026-08-30', true),
    ];
    const res = calculateStreak(stats, '2026-08-30');
    expect(res.currentStreak).toBe(3);
    expect(res.bestStreak).toBe(3);
  });

  it('does not break streak on untracked/gap days (no quests scheduled)', () => {
    // Gap on Aug 28 (e.g. weekend or no quests created)
    const stats = [
      makeStat('2026-08-27', true),
      makeStat('2026-08-29', true),
      makeStat('2026-08-30', true),
    ];
    const res = calculateStreak(stats, '2026-08-30');
    expect(res.currentStreak).toBe(3);
    expect(res.bestStreak).toBe(3);
  });
});
