import { dailyStatsRepository } from '@/db/index';
import { calculateStreak } from '@/domain/streak';
import type { StreakResult } from '@/types/statistics';
import { getLocalDateKey } from '@/utils/date';

/**
 * StreakService — Focused service for streak-related operations.
 * Thin wrapper that delegates to domain logic.
 */
export const streakService = {
  /** Get current streak information */
  async getStreak(): Promise<StreakResult> {
    const allStats = await dailyStatsRepository.getAllSorted();
    return calculateStreak(allStats, getLocalDateKey());
  },
};
