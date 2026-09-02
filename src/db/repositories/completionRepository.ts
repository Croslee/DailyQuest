import type { DailyQuestDB } from '../database';
import type { QuestCompletion } from '@/types/completion';

/**
 * Repository for QuestCompletion records.
 * Completion records are IMMUTABLE historical records — never modify them.
 * The only mutation allowed is deletion (for undo within the same session).
 */
export class CompletionRepository {
  constructor(private db: DailyQuestDB) {}

  /** Create a completion record */
  async create(record: QuestCompletion): Promise<void> {
    await this.db.completionRecords.add(record);
  }

  /** Get all completion records for a specific date */
  async getByDate(date: string): Promise<QuestCompletion[]> {
    return this.db.completionRecords.where('date').equals(date).toArray();
  }

  /** Get completion records for a date range (inclusive) */
  async getByDateRange(from: string, to: string): Promise<QuestCompletion[]> {
    return this.db.completionRecords
      .where('date')
      .between(from, to, true, true)
      .toArray();
  }

  /** Get completion record by quest instance ID (for undo) */
  async getByInstanceId(questInstanceId: string): Promise<QuestCompletion | undefined> {
    return this.db.completionRecords
      .where('questInstanceId')
      .equals(questInstanceId)
      .first();
  }

  /** Update an existing completion record (for re-completion) */
  async update(record: QuestCompletion): Promise<void> {
    await this.db.completionRecords.put(record);
  }

  /** Delete a completion record by ID (for undo) */
  async delete(id: string): Promise<void> {
    await this.db.completionRecords.delete(id);
  }

  /** Delete completion record by instance ID (for undo) */
  async deleteByInstanceId(questInstanceId: string): Promise<void> {
    await this.db.completionRecords
      .where('questInstanceId')
      .equals(questInstanceId)
      .delete();
  }

  /** Get all completion records for a specific quest */
  async getByQuestId(questId: string): Promise<QuestCompletion[]> {
    return this.db.completionRecords.where('questId').equals(questId).toArray();
  }

  /** Get total XP earned across all records */
  async getTotalXP(): Promise<number> {
    let total = 0;
    await this.db.completionRecords
      .where('status')
      .equals('completed')
      .each(record => { total += record.xpEarned; });
    return total;
  }

  /** Get total XP earned in a date range */
  async getXPInRange(from: string, to: string): Promise<number> {
    let total = 0;
    await this.db.completionRecords
      .where('date')
      .between(from, to, true, true)
      .and(record => record.status === 'completed')
      .each(record => { total += record.xpEarned; });
    return total;
  }

  /** Get all completion records */
  async getAll(): Promise<QuestCompletion[]> {
    return this.db.completionRecords.toArray();
  }

  /** Bulk create completion records (for import) */
  async bulkCreate(records: QuestCompletion[]): Promise<void> {
    await this.db.completionRecords.bulkAdd(records);
  }

  /** Get completion count */
  async getCompletedCount(): Promise<number> {
    return this.db.completionRecords.where('status').equals('completed').count();
  }
}
