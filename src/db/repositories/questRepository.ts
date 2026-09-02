import type { DailyQuestDB } from '../database';
import type { Quest } from '@/types/quest';

/**
 * Repository for Quest template CRUD operations.
 * Quests are never truly deleted — they are archived to preserve history.
 */
export class QuestRepository {
  constructor(private db: DailyQuestDB) {}

  /** Get all quests (including archived) */
  async getAll(): Promise<Quest[]> {
    return this.db.quests.toArray();
  }

  /** Get only active (non-archived) quests */
  async getActive(): Promise<Quest[]> {
    return this.db.quests.filter(q => !q.archived).toArray();
  }

  /** Get only archived quests */
  async getArchived(): Promise<Quest[]> {
    return this.db.quests.filter(q => q.archived).toArray();
  }

  /** Get a quest by ID */
  async getById(id: string): Promise<Quest | undefined> {
    return this.db.quests.get(id);
  }

  /** Create a new quest */
  async create(quest: Quest): Promise<void> {
    await this.db.quests.add(quest);
  }

  /** Update an existing quest */
  async update(quest: Quest): Promise<void> {
    await this.db.quests.put(quest);
  }

  /** Permanently delete a quest (use archive instead in most cases) */
  async delete(id: string): Promise<void> {
    await this.db.quests.delete(id);
  }

  /** Get quests by category */
  async getByCategory(category: string): Promise<Quest[]> {
    return this.db.quests.where('category').equals(category).toArray();
  }

  /** Get count of active quests */
  async getActiveCount(): Promise<number> {
    return this.db.quests.filter(q => !q.archived).count();
  }
}
