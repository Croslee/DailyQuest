import type { Difficulty } from '@/types/quest';
import type { LevelResult } from '@/types/statistics';
import { XP_DEFAULTS } from '@/constants/defaults';

/**
 * Get the default XP for a difficulty level.
 */
export function getDefaultXP(difficulty: Difficulty): number {
  return XP_DEFAULTS[difficulty];
}

/**
 * Calculate the cumulative XP required to reach a given level.
 * Formula: 100 × level × (level + 1) / 2
 *
 * Level 1: 100 XP
 * Level 2: 300 XP (cumulative)
 * Level 3: 600 XP (cumulative)
 * Level 5: 1,500 XP
 * Level 10: 5,500 XP
 * Level 20: 21,000 XP
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 0) return 0;
  return 100 * level * (level + 1) / 2;
}

/**
 * Calculate the current level from total XP.
 * Inverse: level = floor((-1 + sqrt(1 + 8 * totalXP / 100)) / 2)
 */
export function calculateLevel(totalXP: number): number {
  if (totalXP <= 0) return 0;
  return Math.floor((-1 + Math.sqrt(1 + (8 * totalXP) / 100)) / 2);
}

/**
 * Get full level information from total XP.
 */
export function getLevelInfo(totalXP: number): LevelResult {
  const level = calculateLevel(totalXP);
  const currentLevelXP = xpRequiredForLevel(level);
  const nextLevelXP = xpRequiredForLevel(level + 1);
  const xpIntoCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const progress = xpNeededForNext > 0
    ? Math.round((xpIntoCurrentLevel / xpNeededForNext) * 1000) / 10
    : 0;

  return {
    level,
    totalXP,
    currentLevelXP: xpIntoCurrentLevel,
    nextLevelXP: xpNeededForNext,
    progress,
  };
}

/**
 * Calculate the Streak Multiplier bonus multiplier.
 * Formula: +5% XP bonus for each streak day up to +50% max (1.0x to 1.5x multiplier).
 * e.g.
 * Streak 0d -> 1.0x
 * Streak 3d -> 1.15x
 * Streak 7d -> 1.35x
 * Streak 10d+ -> 1.5x (Max Combo Bonus)
 */
export function calculateStreakMultiplier(currentStreak: number): number {
  if (currentStreak <= 0) return 1.0;
  const bonus = Math.min(0.5, currentStreak * 0.05);
  return Math.round((1.0 + bonus) * 100) / 100;
}

/**
 * Calculate quest XP with streak combo multiplier applied.
 */
export function calculateXPWithStreakBonus(baseXP: number, currentStreak: number): {
  totalXP: number;
  bonusXP: number;
  multiplier: number;
} {
  const multiplier = calculateStreakMultiplier(currentStreak);
  const totalXP = Math.round(baseXP * multiplier);
  const bonusXP = Math.max(0, totalXP - baseXP);
  return { totalXP, bonusXP, multiplier };
}

/**
 * Calculate bonus XP awarded when reaching or exceeding the Daily Quest Goal.
 * e.g. +25 bonus XP upon hitting daily target!
 */
export function calculateDailyGoalBonus(dailyGoal: number, completedToday: number): number {
  if (dailyGoal <= 0 || completedToday < dailyGoal) return 0;
  return 25;
}
