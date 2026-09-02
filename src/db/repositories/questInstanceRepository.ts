import type { DailyQuestDB } from '../database';
import type { QuestInstance, InstanceStatus } from '@/types/quest';
import { nowISO } from '@/utils/date';

/**
 * Repository for QuestInstance operations.
 * Handles daily materializations and status updates.
 */
export class QuestInstanceRepository {
  constructor(private db: DailyQuestDB) {}

  /** Get an instance by ID */
  async getById(id: string): Promise<QuestInstance | undefined> {
    return this.db.questInstances.get(id);
  }

  /** Get all instances for a specific date */
  async getByDate(date: string): Promise<QuestInstance[]> {
    return this.db.questInstances.where('date').equals(date).toArray();
  }

  /** Get all instances for a date range (inclusive) */
  async getByDateRange(from: string, to: string): Promise<QuestInstance[]> {
    return this.db.questInstances
      .where('date')
      .between(from, to, true, true)
      .toArray();
  }

  /** Get instance by quest ID and date (compound index lookup) */
  async getByQuestAndDate(questId: string, date: string): Promise<QuestInstance | undefined> {
    return this.db.questInstances
      .where('[questId+date]')
      .equals([questId, date])
      .first();
  }

  /** Check if an instance exists for a quest on a given date */
  async exists(questId: string, date: string): Promise<boolean> {
    const count = await this.db.questInstances
      .where('[questId+date]')
      .equals([questId, date])
      .count();
    return count > 0;
  }

  /** Check if any instance exists for a quest (for 'once' recurrence) */
  async existsForQuest(questId: string): Promise<boolean> {
    const count = await this.db.questInstances
      .where('questId')
      .equals(questId)
      .count();
    return count > 0;
  }

  /** Create a new instance */
  async create(instance: QuestInstance): Promise<void> {
    await this.db.questInstances.add(instance);
  }

  /** Update an existing instance */
  async update(instance: QuestInstance): Promise<void> {
    await this.db.questInstances.put(instance);
  }

  /** Update the status of an instance */
  async updateStatus(id: string, status: InstanceStatus): Promise<void> {
    await this.db.questInstances.update(id, {
      status,
      updatedAt: nowISO(),
    });
  }

  /** Get all pending instances before a given date (for marking as missed) */
  async getPendingBefore(date: string): Promise<QuestInstance[]> {
    return this.db.questInstances
      .where('date')
      .below(date)
      .and(instance => instance.status === 'pending')
      .toArray();
  }

  /** Get all instances for a specific quest */
  async getByQuestId(questId: string): Promise<QuestInstance[]> {
    return this.db.questInstances.where('questId').equals(questId).toArray();
  }

  /** Delete an instance by ID */
  async delete(id: string): Promise<void> {
    await this.db.questInstances.delete(id);
  }

  /** Bulk create instances */
  async bulkCreate(instances: QuestInstance[]): Promise<void> {
    await this.db.questInstances.bulkAdd(instances);
  }
}
