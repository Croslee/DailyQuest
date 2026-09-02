import type { Quest, QuestInstance } from '@/types/quest';
import {
  questRepository,
  questInstanceRepository,
  completionRepository,
  dailyStatsRepository,
} from '@/db/index';
import { shouldGenerateInstance, findMissedInstances } from '@/domain/quest-generation';
import { calculateDailyScore } from '@/domain/score';
import { generateId } from '@/utils/id';
import { getLocalDateKey, nowISO } from '@/utils/date';

/**
 * QuestGenerationService — Handles daily quest instance generation.
 *
 * This service is IDEMPOTENT: calling it multiple times for the same day
 * produces no duplicates.
 *
 * Triggered from:
 * 1. Popup/Dashboard mount (useEffect)
 * 2. Service worker alarm (midnight)
 * 3. Date change detection (useDateCheck)
 */
let inFlightGeneration: Promise<number> | null = null;

export const questGenerationService = {
  /**
   * Generate quest instances for today and handle missed quests from previous days.
   *
   * Steps:
   * 1. Get today's date
   * 2. Mark pending instances from previous days as 'missed'
   * 3. Update daily stats for affected days
   * 4. Generate today's instances for active quests
   *
   * @returns Number of new instances created
   */
  async generateForToday(): Promise<number> {
    const today = getLocalDateKey();
    return this.generateForDate(today);
  },

  /**
   * Generate quest instances for a specific date.
   * Used by generateForToday and testable with any date.
   */
  async generateForDate(date: string): Promise<number> {
    // If a generation is currently running, wait for it to complete to prevent race conditions
    while (inFlightGeneration) {
      await inFlightGeneration;
    }

    const runGeneration = async (): Promise<number> => {
      // Step 1: Mark pending instances from previous days as 'missed'
      await this.markMissedInstances(date);

      // Step 2: Get active quests and existing instances
      const activeQuests = await questRepository.getActive();
      const existingInstances = await questInstanceRepository.getByDate(date);

      // Step 2b: Deduplicate any accidental duplicate instances for this date
      const seenQuests = new Set<string>();
      const validInstances: QuestInstance[] = [];
      for (const inst of existingInstances) {
        if (seenQuests.has(inst.questId)) {
          // Extra duplicate found — remove it from database
          await questInstanceRepository.delete(inst.id);
        } else {
          seenQuests.add(inst.questId);
          validInstances.push(inst);
        }
      }

      // Also need all instances for 'once' recurrence check
      const allInstanceSummaries: { questId: string; date: string }[] = [];
      
      // For 'once' quests, we need to check if they have ANY instance
      const onceQuests = activeQuests.filter(q => q.recurrence.type === 'once');
      for (const quest of onceQuests) {
        const hasInstance = await questInstanceRepository.existsForQuest(quest.id);
        if (hasInstance) {
          allInstanceSummaries.push({ questId: quest.id, date });
        }
      }

      // Add today's existing instances to the summary
      for (const inst of validInstances) {
        allInstanceSummaries.push({ questId: inst.questId, date: inst.date });
      }

      // Step 3: Generate instances for quests that need them
      const now = nowISO();
      let createdCount = 0;

      for (const quest of activeQuests) {
        if (shouldGenerateInstance(quest, date, allInstanceSummaries)) {
          const subtasks = quest.subtasks?.map(s => ({ ...s, completed: false }));

          const instance: QuestInstance = {
            id: generateId(),
            questId: quest.id,
            date,
            status: 'pending',
            subtasks,
            createdAt: now,
            updatedAt: now,
          };

          await questInstanceRepository.create(instance);
          createdCount++;

          // Add to summaries to prevent duplicates in this run
          allInstanceSummaries.push({ questId: quest.id, date });
        }
      }

      // Step 4: Update daily stats for today
      await this.updateDailyStats(date);

      return createdCount;
    };

    inFlightGeneration = runGeneration();
    try {
      return await inFlightGeneration;
    } finally {
      inFlightGeneration = null;
    }
  },

  /**
   * Mark all pending instances from days before the given date as 'missed'.
   * Also creates completion records and updates daily stats for affected days.
   */
  async markMissedInstances(today: string): Promise<void> {
    const pendingInstances = await questInstanceRepository.getPendingBefore(today);
    
    if (pendingInstances.length === 0) return;

    const affectedDates = new Set<string>();

    for (const instance of pendingInstances) {
      // Update instance status
      await questInstanceRepository.updateStatus(instance.id, 'missed');

      // Create a completion record for the missed quest
      const quest = await questRepository.getById(instance.questId);
      await completionRepository.create({
        id: generateId(),
        questId: instance.questId,
        questInstanceId: instance.id,
        questTitle: quest?.title ?? 'Unknown Quest',
        questCategory: quest?.category ?? 'Other',
        questDifficulty: quest?.difficulty ?? 'normal',
        date: instance.date,
        status: 'missed',
        xpEarned: 0,
      });

      affectedDates.add(instance.date);
    }

    // Update daily stats for all affected dates
    for (const date of affectedDates) {
      await this.updateDailyStats(date);
    }
  },

  /**
   * Recalculate and upsert daily stats for a specific date.
   */
  async updateDailyStats(date: string): Promise<void> {
    const instances = await questInstanceRepository.getByDate(date);
    const completions = await completionRepository.getByDate(date);

    const score = calculateDailyScore(instances);
    const xpEarned = completions
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + c.xpEarned, 0);

    await dailyStatsRepository.upsert({
      date,
      totalQuests: score.total,
      completed: score.completed,
      skipped: score.skipped,
      missed: score.missed,
      pending: score.pending,
      score: score.score,
      xpEarned,
      isSuccessful: score.isSuccessful,
    });
  },
};
