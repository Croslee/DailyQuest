import type { DailyQuestDB } from '../database';
import type { DailyStats } from '@/types/statistics';

/**
 * Repository for DailyStats records.
 * DailyStats is a CACHE — it can be fully rebuilt from instances + completions.
 */
export class DailyStatsRepository {
  constructor(private db: DailyQuestDB) {}

  /** Get stats for a specific date */
  async getByDate(date: string): Promise<DailyStats | undefined> {
    return this.db.dailyStats.get(date);
  }

  /** Get stats for a date range (inclusive) */
  async getByDateRange(from: string, to: string): Promise<DailyStats[]> {
    return this.db.dailyStats
      .where('date')
      .between(from, to, true, true)
      .toArray();
  }

  /** Upsert (create or update) daily stats */
  async upsert(stats: DailyStats): Promise<void> {
    await this.db.dailyStats.put(stats);
  }

  /** Get all daily stats */
  async getAll(): Promise<DailyStats[]> {
    return this.db.dailyStats.toArray();
  }

  /** Delete stats for a specific date */
  async delete(date: string): Promise<void> {
    await this.db.dailyStats.delete(date);
  }

  /** Bulk upsert stats (for import or rebuild) */
  async bulkUpsert(stats: DailyStats[]): Promise<void> {
    await this.db.dailyStats.bulkPut(stats);
  }

  /** Get the count of successful days */
  async getSuccessfulDayCount(): Promise<number> {
    return this.db.dailyStats.filter(s => s.isSuccessful).count();
  }

  /** Get all stats sorted by date */
  async getAllSorted(): Promise<DailyStats[]> {
    return this.db.dailyStats.orderBy('date').toArray();
  }
}
