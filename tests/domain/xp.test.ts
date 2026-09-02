import { describe, it, expect } from 'vitest';
import {
  getDefaultXP,
  xpRequiredForLevel,
  calculateLevel,
  getLevelInfo,
  calculateStreakMultiplier,
  calculateXPWithStreakBonus,
  calculateDailyGoalBonus,
} from '@/domain/xp';

describe('XP & Level Progression', () => {
  it('returns standard difficulty XP defaults', () => {
    expect(getDefaultXP('easy')).toBe(10);
    expect(getDefaultXP('normal')).toBe(20);
    expect(getDefaultXP('hard')).toBe(30);
    expect(getDefaultXP('epic')).toBe(50);
  });

  it('calculates cumulative XP required for levels', () => {
    expect(xpRequiredForLevel(0)).toBe(0);
    expect(xpRequiredForLevel(1)).toBe(100);
    expect(xpRequiredForLevel(2)).toBe(300);
    expect(xpRequiredForLevel(3)).toBe(600);
    expect(xpRequiredForLevel(5)).toBe(1500);
    expect(xpRequiredForLevel(10)).toBe(5500);
  });

  it('calculates current level from total XP via inverse formula', () => {
    expect(calculateLevel(0)).toBe(0);
    expect(calculateLevel(50)).toBe(0);
    expect(calculateLevel(100)).toBe(1);
    expect(calculateLevel(250)).toBe(1);
    expect(calculateLevel(300)).toBe(2);
    expect(calculateLevel(599)).toBe(2);
    expect(calculateLevel(600)).toBe(3);
    expect(calculateLevel(1500)).toBe(5);
    expect(calculateLevel(5500)).toBe(10);
  });

  it('calculates full LevelResult accurately', () => {
    // 200 total XP: Level 1 (requires 100). Next level is Level 2 (requires 300 total, i.e. 200 more).
    // Current progress: 100 into Level 1, 200 needed for Level 2 -> 50%
    const info = getLevelInfo(200);
    expect(info.level).toBe(1);
    expect(info.totalXP).toBe(200);
    expect(info.currentLevelXP).toBe(100);
    expect(info.nextLevelXP).toBe(200);
    expect(info.progress).toBe(50);
  });

  it('calculates streak multipliers accurately up to 1.5x cap', () => {
    expect(calculateStreakMultiplier(0)).toBe(1.0);
    expect(calculateStreakMultiplier(1)).toBe(1.05);
    expect(calculateStreakMultiplier(3)).toBe(1.15);
    expect(calculateStreakMultiplier(7)).toBe(1.35);
    expect(calculateStreakMultiplier(10)).toBe(1.5);
    expect(calculateStreakMultiplier(30)).toBe(1.5);

    const bonusResult = calculateXPWithStreakBonus(20, 7);
    expect(bonusResult.multiplier).toBe(1.35);
    expect(bonusResult.totalXP).toBe(27);
    expect(bonusResult.bonusXP).toBe(7);

    expect(calculateDailyGoalBonus(3, 2)).toBe(0);
    expect(calculateDailyGoalBonus(3, 3)).toBe(25);
    expect(calculateDailyGoalBonus(3, 5)).toBe(25);
  });
});
