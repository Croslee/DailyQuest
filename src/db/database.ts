import Dexie, { type Table } from 'dexie';
import type { Quest, QuestInstance } from '@/types/quest';
import type { QuestCompletion } from '@/types/completion';
import type { DailyStats } from '@/types/statistics';
import type { SettingsRecord } from '@/types/settings';
import type { Achievement } from '@/types/achievement';

/**
 * DailyQuestDB — The primary IndexedDB database.
 * 
 * Object stores:
 * - quests: Reusable quest templates/definitions
 * - questInstances: Daily materializations of quests
 * - completionRecords: Immutable historical completion records
 * - dailyStats: Cached daily statistics (derivable from instances + completions)
 * - settings: Key-value application settings
 * - customAchievements: User-defined custom achievements
 */
export class DailyQuestDB extends Dexie {
  quests!: Table<Quest, string>;
  questInstances!: Table<QuestInstance, string>;
  completionRecords!: Table<QuestCompletion, string>;
  dailyStats!: Table<DailyStats, string>;
  settings!: Table<SettingsRecord, string>;
  customAchievements!: Table<Achievement, string>;

  constructor() {
    super('DailyQuestDB');

    this.version(1).stores({
      quests: 'id, category, archived',
      questInstances: 'id, questId, date, status, [questId+date]',
      completionRecords: 'id, questId, questInstanceId, date, status, [questId+date]',
      dailyStats: 'date',
      settings: 'key',
    });

    this.version(2).stores({
      customAchievements: 'id, createdAt, unlocked',
    });
  }
}

/** Singleton database instance */
export const db = new DailyQuestDB();
