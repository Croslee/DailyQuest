import { describe, it, expect } from 'vitest';
import { calculateDailyScore, getContributionLevel } from '@/domain/score';
import type { QuestInstance } from '@/types/quest';

function makeInstance(status: QuestInstance['status']): QuestInstance {
  return {
    id: 'inst-1',
    questId: 'quest-1',
    date: '2026-08-30',
    status,
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
  };
}

describe('calculateDailyScore', () => {
  it('calculates 100% when all quests completed', () => {
    const instances = [makeInstance('completed'), makeInstance('completed'), makeInstance('completed')];
    const res = calculateDailyScore(instances);
    expect(res.score).toBe(100);
    expect(res.completed).toBe(3);
    expect(res.actionable).toBe(3);
    expect(res.isSuccessful).toBe(true);
  });

  it('calculates 50% score accurately', () => {
    const instances = [
      makeInstance('completed'),
      makeInstance('completed'),
      makeInstance('missed'),
      makeInstance('missed'),
    ];
    const res = calculateDailyScore(instances);
    expect(res.score).toBe(50);
    expect(res.completed).toBe(2);
    expect(res.missed).toBe(2);
    expect(res.actionable).toBe(4);
    expect(res.isSuccessful).toBe(false);
  });

  it('calculates 83.3% and marks day successful when score >= 70%', () => {
    // Example from spec: 5 completed, 1 missed, 1 skipped -> 5/6 = 83.3%
    const instances = [
      makeInstance('completed'),
      makeInstance('completed'),
      makeInstance('completed'),
      makeInstance('completed'),
      makeInstance('completed'),
      makeInstance('missed'),
      makeInstance('skipped'),
    ];
    const res = calculateDailyScore(instances);
    expect(res.completed).toBe(5);
    expect(res.missed).toBe(1);
    expect(res.skipped).toBe(1);
    expect(res.actionable).toBe(6);
    expect(res.score).toBe(83.3);
    expect(res.isSuccessful).toBe(true);
  });

  it('excludes skipped quests from denominator completely', () => {
    // 1 completed, 3 skipped -> 1/1 = 100%
    const instances = [
      makeInstance('completed'),
      makeInstance('skipped'),
      makeInstance('skipped'),
      makeInstance('skipped'),
    ];
    const res = calculateDailyScore(instances);
    expect(res.completed).toBe(1);
    expect(res.skipped).toBe(3);
    expect(res.actionable).toBe(1);
    expect(res.score).toBe(100);
    expect(res.isSuccessful).toBe(true);
  });

  it('handles 0 quests without dividing by zero', () => {
    const res = calculateDailyScore([]);
    expect(res.score).toBe(0);
    expect(res.actionable).toBe(0);
    expect(res.isSuccessful).toBe(false);
  });

  it('handles only-skipped quests gracefully', () => {
    const instances = [makeInstance('skipped'), makeInstance('skipped')];
    const res = calculateDailyScore(instances);
    expect(res.score).toBe(0);
    expect(res.actionable).toBe(0);
    expect(res.isSuccessful).toBe(false);
  });
});

describe('getContributionLevel', () => {
  it('maps scores to correct intensity levels 0 to 4', () => {
    expect(getContributionLevel(0)).toBe(0);
    expect(getContributionLevel(-5)).toBe(0);
    expect(getContributionLevel(10)).toBe(1);
    expect(getContributionLevel(25)).toBe(1);
    expect(getContributionLevel(26)).toBe(2);
    expect(getContributionLevel(50)).toBe(2);
    expect(getContributionLevel(51)).toBe(3);
    expect(getContributionLevel(75)).toBe(3);
    expect(getContributionLevel(76)).toBe(4);
    expect(getContributionLevel(100)).toBe(4);
  });
});
