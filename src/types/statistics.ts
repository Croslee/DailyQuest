/**
 * DailyStats — Cached/derived statistics for a single day.
 * Can be fully rebuilt from QuestInstance + QuestCompletion records.
 */
export interface DailyStats {
  /** Local date key (YYYY-MM-DD) — primary key */
  date: string;
  /** Total quest instances for this day */
  totalQuests: number;
  /** Number of completed quests */
  completed: number;
  /** Number of skipped quests (excluded from score denominator) */
  skipped: number;
  /** Number of missed quests */
  missed: number;
  /** Number of pending quests */
  pending: number;
  /** Daily score: completed / (completed + missed + pending) × 100 */
  score: number;
  /** Total XP earned this day */
  xpEarned: number;
  /** Whether this day meets the success threshold (score >= 70) */
  isSuccessful: boolean;
}

/** Result of a daily score calculation */
export interface DailyScoreResult {
  total: number;
  completed: number;
  skipped: number;
  missed: number;
  pending: number;
  actionable: number;
  score: number;
  isSuccessful: boolean;
}

/** Streak calculation result */
export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
  successfulDays: number;
  totalTrackedDays: number;
}

/** Level calculation result */
export interface LevelResult {
  level: number;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
}

/** Contribution chart data for a single day */
export interface ContributionDay {
  date: string;
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
  xpEarned: number;
  completed: number;
  total: number;
}

/** Category statistics */
export interface CategoryStats {
  category: string;
  completed: number;
  total: number;
  percentage: number;
  xpEarned: number;
}

/** Overall statistics summary */
export interface StatisticsSummary {
  totalQuestsCreated: number;
  totalCompleted: number;
  completionRate: number;
  streak: StreakResult;
  level: LevelResult;
  successfulDays: number;
  totalTrackedDays: number;
  averageDailyScore: number;
  averageDailyXP: number;
  mostProductiveDay?: string;
  mostCompletedCategory?: string;
  categoryStats: CategoryStats[];
}
