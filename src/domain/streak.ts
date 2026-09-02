import type { DailyStats } from '@/types/statistics';
import type { StreakResult } from '@/types/statistics';
import { getLocalDateKey, parseDateKey } from '@/utils/date';

/**
 * Calculate streak information from daily stats.
 *
 * Rules:
 * - A day is "successful" when score >= 70% AND actionable > 0
 * - A day with zero quests (no data) does NOT break the streak
 * - A day with only skipped quests (actionable = 0) does NOT break the streak
 * - Only days with actionable > 0 AND score < 70% break the streak
 * - Current streak: consecutive successful days counting back from today/yesterday
 * - Today is included if successful; if today is not yet successful, streak counts from yesterday
 * - Best streak: longest consecutive run of successful days in all history
 *
 * @param sortedStats - DailyStats sorted by date ASCENDING
 * @param today - Today's date key (YYYY-MM-DD)
 */
export function calculateStreak(
  sortedStats: DailyStats[],
  today: string = getLocalDateKey()
): StreakResult {
  if (sortedStats.length === 0) {
    return { currentStreak: 0, bestStreak: 0, successfulDays: 0, totalTrackedDays: 0 };
  }

  // Count total successful days
  const successfulDays = sortedStats.filter(s => s.isSuccessful).length;
  const totalTrackedDays = sortedStats.length;

  // Build a map of date -> stats for quick lookup
  const statsMap = new Map<string, DailyStats>();
  for (const stat of sortedStats) {
    statsMap.set(stat.date, stat);
  }

  // Calculate best streak by scanning all stats
  let bestStreak = 0;
  let currentRun = 0;

  // We need to iterate day by day from the first stat date to today
  // to properly detect gaps (days with actionable quests that failed)
  const firstDate = sortedStats[0].date;
  const startDate = parseDateKey(firstDate);
  const endDate = parseDateKey(today);
  const allDays: string[] = [];
  
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    allDays.push(getLocalDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const day of allDays) {
    const stat = statsMap.get(day);
    if (!stat) {
      // No data for this day — doesn't break streak
      continue;
    }
    
    const actionable = stat.totalQuests - stat.skipped;
    if (actionable === 0) {
      // Only skipped quests — doesn't break streak
      continue;
    }

    if (stat.isSuccessful) {
      currentRun++;
      if (currentRun > bestStreak) {
        bestStreak = currentRun;
      }
    } else {
      // Failed day — breaks the streak
      currentRun = 0;
    }
  }

  // Calculate current streak: walk backwards from today
  let currentStreak = 0;
  const reverseDays = [...allDays].reverse();

  for (const day of reverseDays) {
    const stat = statsMap.get(day);
    if (!stat) {
      // No data — doesn't break streak, continue checking
      continue;
    }

    const actionable = stat.totalQuests - stat.skipped;
    if (actionable === 0) {
      // Only skipped — doesn't break streak
      continue;
    }

    if (stat.isSuccessful) {
      currentStreak++;
    } else {
      // Failed day breaks current streak
      break;
    }
  }

  return {
    currentStreak,
    bestStreak,
    successfulDays,
    totalTrackedDays,
  };
}
