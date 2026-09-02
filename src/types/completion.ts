import type { Difficulty } from './quest';

/**
 * QuestCompletion — Immutable historical record of a quest outcome.
 * 
 * IMPORTANT: This record snapshots quest metadata at completion time.
 * If a quest's title, XP, or category changes later, this record is unaffected.
 * If a quest is deleted or archived, this record survives.
 */
export interface QuestCompletion {
  /** Unique identifier */
  id: string;
  /** FK to Quest.id (may reference a deleted quest) */
  questId: string;
  /** FK to QuestInstance.id */
  questInstanceId: string;
  /** Snapshot of quest title at completion time */
  questTitle: string;
  /** Snapshot of quest category at completion time */
  questCategory: string;
  /** Snapshot of quest difficulty at completion time */
  questDifficulty: Difficulty;
  /** Local date key (YYYY-MM-DD) */
  date: string;
  /** Outcome status */
  status: 'completed' | 'skipped' | 'missed';
  /** ISO 8601 timestamp of completion (only for status='completed') */
  completedAt?: string;
  /** XP earned — snapshot from quest.xp at completion time, NEVER recalculated */
  xpEarned: number;
}
