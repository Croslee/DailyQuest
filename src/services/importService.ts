import { db } from '@/db/index';
import type { ExportData, ImportResult } from '@/types/export';
import {
  validateImportData,
  isValidQuest,
  isValidQuestInstance,
  isValidCompletion,
  isValidDailyStats,
} from '@/domain/validation';

export const importService = {
  /**
   * Parse and validate raw JSON string from an imported file.
   */
  validateJSON(jsonString: string): { valid: boolean; data?: ExportData; errors: string[] } {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return { valid: false, errors: ['Invalid JSON: File is not well-formed JSON.'] };
    }

    const validationErrors = validateImportData(parsed);
    if (validationErrors.length > 0) {
      return {
        valid: false,
        errors: validationErrors.map(e => `${e.field}: ${e.message}`),
      };
    }

    return {
      valid: true,
      data: parsed as ExportData,
      errors: [],
    };
  },

  /**
   * Import data into IndexedDB safely inside an atomic transaction.
   * - Deduplicates existing records (preserves existing data)
   * - Only inserts valid records matching type guards
   * - Never silently overwrites user data
   */
  async importData(data: ExportData): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      inserted: {
        quests: 0,
        questInstances: 0,
        completionRecords: 0,
        dailyStats: 0,
      },
      skipped: {
        quests: 0,
        questInstances: 0,
        completionRecords: 0,
        dailyStats: 0,
      },
      errors: [],
    };

    try {
      await db.transaction('rw', [db.quests, db.questInstances, db.completionRecords, db.dailyStats], async () => {
        // 1. Quests
        for (const quest of data.quests) {
          if (!isValidQuest(quest)) {
            result.errors.push(`Skipped invalid quest record: ${JSON.stringify(quest).slice(0, 50)}...`);
            continue;
          }
          const existing = await db.quests.get(quest.id);
          if (existing) {
            result.skipped.quests++;
          } else {
            await db.quests.add(quest);
            result.inserted.quests++;
          }
        }

        // 2. Quest Instances
        for (const instance of data.questInstances) {
          if (!isValidQuestInstance(instance)) {
            result.errors.push(`Skipped invalid quest instance: ${JSON.stringify(instance).slice(0, 50)}...`);
            continue;
          }
          const existing = await db.questInstances.get(instance.id);
          if (existing) {
            result.skipped.questInstances++;
          } else {
            await db.questInstances.add(instance);
            result.inserted.questInstances++;
          }
        }

        // 3. Completion Records
        for (const completion of data.completionRecords) {
          if (!isValidCompletion(completion)) {
            result.errors.push(`Skipped invalid completion record: ${JSON.stringify(completion).slice(0, 50)}...`);
            continue;
          }
          const existing = await db.completionRecords.get(completion.id);
          if (existing) {
            result.skipped.completionRecords++;
          } else {
            await db.completionRecords.add(completion);
            result.inserted.completionRecords++;
          }
        }

        // 4. Daily Stats
        for (const stat of data.dailyStats) {
          if (!isValidDailyStats(stat)) {
            result.errors.push(`Skipped invalid daily stat: ${JSON.stringify(stat).slice(0, 50)}...`);
            continue;
          }
          const existing = await db.dailyStats.get(stat.date);
          if (existing) {
            result.skipped.dailyStats++;
          } else {
            await db.dailyStats.add(stat);
            result.inserted.dailyStats++;
          }
        }
      });
    } catch (err) {
      result.success = false;
      result.errors.push(`Database transaction failed: ${String(err)}`);
    }

    return result;
  },
};
