import type { DailyStats, StreakResult, LevelResult, CategoryStats, StatisticsSummary, ContributionDay } from '@/types/statistics';
import { completionRepository, dailyStatsRepository } from '@/db/index';
import { calculateStreak } from '@/domain/streak';
import { getLevelInfo } from '@/domain/xp';
import { getContributionLevel } from '@/domain/score';
import { getLocalDateKey, getOneYearAgo, getDateRange } from '@/utils/date';

/**
 * StatisticsService — Aggregates and derives statistics from historical data.
 */
export const statisticsService = {
  /** Get streak information */
  async getStreak(): Promise<StreakResult> {
    const allStats = await dailyStatsRepository.getAllSorted();
    return calculateStreak(allStats, getLocalDateKey());
  },

  /** Get level information from total XP */
  async getLevelInfo(): Promise<LevelResult> {
    const totalXP = await completionRepository.getTotalXP();
    return getLevelInfo(totalXP);
  },

  /** Get total XP */
  async getTotalXP(): Promise<number> {
    return completionRepository.getTotalXP();
  },

  /** Get contribution chart data for the past year */
  async getContributionData(): Promise<ContributionDay[]> {
    const from = getOneYearAgo();
    const to = getLocalDateKey();
    const allDates = getDateRange(from, to);
    const stats = await dailyStatsRepository.getByDateRange(from, to);

    const statsMap = new Map<string, DailyStats>();
    for (const stat of stats) {
      statsMap.set(stat.date, stat);
    }

    return allDates.map(date => {
      const stat = statsMap.get(date);
      const score = stat?.score ?? 0;
      return {
        date,
        score,
        level: getContributionLevel(score),
        xpEarned: stat?.xpEarned ?? 0,
        completed: stat?.completed ?? 0,
        total: stat?.totalQuests ?? 0,
      };
    });
  },

  /** Get daily stats for a specific date */
  async getDayStats(date: string): Promise<DailyStats | undefined> {
    return dailyStatsRepository.getByDate(date);
  },

  /** Get daily stats for a date range */
  async getStatsRange(from: string, to: string): Promise<DailyStats[]> {
    return dailyStatsRepository.getByDateRange(from, to);
  },

  /** Get category breakdown statistics */
  async getCategoryStats(from?: string, to?: string): Promise<CategoryStats[]> {
    const completions = from && to
      ? await completionRepository.getByDateRange(from, to)
      : await completionRepository.getAll();

    const categoryMap = new Map<string, { completed: number; total: number; xpEarned: number }>();

    for (const record of completions) {
      const cat = record.questCategory;
      const existing = categoryMap.get(cat) ?? { completed: 0, total: 0, xpEarned: 0 };
      existing.total++;
      if (record.status === 'completed') {
        existing.completed++;
        existing.xpEarned += record.xpEarned;
      }
      categoryMap.set(cat, existing);
    }

    const totalCompleted = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.completed, 0);

    return Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        completed: stats.completed,
        total: stats.total,
        percentage: totalCompleted > 0
          ? Math.round((stats.completed / totalCompleted) * 1000) / 10
          : 0,
        xpEarned: stats.xpEarned,
      }))
      .sort((a, b) => b.completed - a.completed);
  },

  /** Get full statistics summary */
  async getSummary(): Promise<StatisticsSummary> {
    const [streak, levelInfo, allStats, categoryStats, totalCompleted] = await Promise.all([
      this.getStreak(),
      this.getLevelInfo(),
      dailyStatsRepository.getAllSorted(),
      this.getCategoryStats(),
      completionRepository.getCompletedCount(),
    ]);

    const totalQuestsCreated = allStats.reduce((sum, s) => sum + s.totalQuests, 0);
    const completionRate = totalQuestsCreated > 0
      ? Math.round((totalCompleted / totalQuestsCreated) * 1000) / 10
      : 0;

    const averageDailyScore = allStats.length > 0
      ? Math.round(allStats.reduce((sum, s) => sum + s.score, 0) / allStats.length * 10) / 10
      : 0;

    const averageDailyXP = allStats.length > 0
      ? Math.round(allStats.reduce((sum, s) => sum + s.xpEarned, 0) / allStats.length * 10) / 10
      : 0;

    // Find most productive day (by score, minimum 1 quest)
    const productiveDays = allStats.filter(s => s.totalQuests > 0);
    const mostProductiveDay = productiveDays.length > 0
      ? productiveDays.reduce((best, s) => s.score > best.score ? s : best).date
      : undefined;

    const mostCompletedCategory = categoryStats.length > 0
      ? categoryStats[0].category
      : undefined;

    return {
      totalQuestsCreated,
      totalCompleted,
      completionRate,
      streak,
      level: levelInfo,
      successfulDays: streak.successfulDays,
      totalTrackedDays: streak.totalTrackedDays,
      averageDailyScore,
      averageDailyXP,
      mostProductiveDay,
      mostCompletedCategory,
      categoryStats,
    };
  },
};
