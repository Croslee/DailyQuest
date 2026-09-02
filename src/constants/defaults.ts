import type { Difficulty, Priority } from '@/types/quest';

/** Default XP values per difficulty level */
export const XP_DEFAULTS: Record<Difficulty, number> = {
  easy: 10,
  normal: 20,
  hard: 30,
  epic: 50,
};

/** Built-in categories */
export const DEFAULT_CATEGORIES = [
  'Study',
  'Work',
  'Health',
  'Personal',
  'Other',
] as const;

/** Priority sort order (lower = higher priority in sort) */
export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/** Difficulty display labels */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  epic: 'Epic',
};

/** Priority display labels */
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

/** Streak success threshold (percentage) */
export const STREAK_THRESHOLD = 70;

/** Current export schema version */
export const EXPORT_SCHEMA_VERSION = 1;

/** Database name */
export const DB_NAME = 'DailyQuestDB';

/** Database version */
export const DB_VERSION = 1;

/**
 * XP required for a given level.
 * Formula: 100 × level × (level + 1) / 2
 * This is the cumulative XP needed to reach this level.
 */
export function xpForLevel(level: number): number {
  return 100 * level * (level + 1) / 2;
}

/**
 * Calculate the level from total XP.
 * Inverse of xpForLevel: level = floor((-1 + sqrt(1 + 8*totalXP/100)) / 2)
 */
export function levelFromXP(totalXP: number): number {
  if (totalXP <= 0) return 0;
  return Math.floor((-1 + Math.sqrt(1 + (8 * totalXP) / 100)) / 2);
}
