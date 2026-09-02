import type { Quest, QuestInstance } from '@/types/quest';
import type { QuestCompletion } from '@/types/completion';
import {
  db,
  questRepository,
  questInstanceRepository,
  completionRepository,
} from '@/db/index';
import { generateId } from '@/utils/id';
import { nowISO } from '@/utils/date';
import { notifyDataChanged } from '@/services/syncChannel';
import { calculateXPWithStreakBonus } from '@/domain/xp';
import { streakService } from './streakService';

/**
 * CompletionService — Handles quest completion, undo, skip, and miss operations.
 * Creates immutable completion records with snapshotted quest metadata.
 * Supports auto-reopened quests with zero XP double-awarding.
 *
 * All multi-step mutations are wrapped in Dexie transactions to ensure
 * atomicity — if any step fails, the entire operation is rolled back.
 */
export const completionService = {
  /**
   * Complete a quest instance.
   * If this quest instance was previously completed (e.g. reopened due to subtask changes),
   * it transitions back to 'completed' without awarding duplicate XP.
   * If a skip/missed record exists from a prior state, it is updated in-place.
   *
   * @returns The completion record, or null if quest/instance not found or not pending
   */
  async completeQuest(instanceId: string): Promise<QuestCompletion | null> {
    let currentStreak = 0;
    try {
      const streak = await streakService.getStreak();
      currentStreak = streak.currentStreak;
    } catch {
      currentStreak = 0;
    }

    return db.transaction('rw', [db.questInstances, db.completionRecords, db.quests], async () => {
      const instance = await questInstanceRepository.getById(instanceId);
      if (!instance || instance.status !== 'pending') return null;

      // Check if this instance already has a completion record (re-opened quest or prior skip)
      const existingCompletion = await completionRepository.getByInstanceId(instanceId);

      const quest = await questRepository.getById(instance.questId);
      const questTitle = quest?.title ?? 'Unknown Quest';
      const questCategory = quest?.category ?? 'Other';
      const questDifficulty = quest?.difficulty ?? 'normal';

      const now = nowISO();

      // Update instance status
      await questInstanceRepository.updateStatus(instance.id, 'completed');

      let completion: QuestCompletion;

      if (existingCompletion) {
        // Re-completion or transition from skip/missed:
        const wasCompleted = existingCompletion.status === 'completed';

        if (wasCompleted) {
          // Reopened quest being re-completed:
          // - Preserve original xpEarned in the DB record (historical accuracy)
          // - Only update the completedAt timestamp
          // - Return xpEarned=0 to caller to signal no NEW XP awarded
          const updatedRecord: QuestCompletion = {
            ...existingCompletion,
            completedAt: now,
          };
          await completionRepository.update(updatedRecord);

          // Return a copy with xpEarned=0 to signal no new XP
          completion = { ...updatedRecord, xpEarned: 0 };
        } else {
          // Transition from skip/missed to completed: award full XP with streak bonus
          const { totalXP } = calculateXPWithStreakBonus(quest?.xp ?? 0, currentStreak);
          completion = {
            ...existingCompletion,
            status: 'completed',
            completedAt: now,
            xpEarned: totalXP,
          };
          await completionRepository.update(completion);
        }
      } else {
        // First-time completion: create immutable record with full XP and streak combo bonus
        const { totalXP } = calculateXPWithStreakBonus(quest?.xp ?? 0, currentStreak);
        completion = {
          id: generateId(),
          questId: instance.questId,
          questInstanceId: instance.id,
          questTitle,
          questCategory,
          questDifficulty,
          date: instance.date,
          status: 'completed',
          completedAt: now,
          xpEarned: totalXP,
        };
        await completionRepository.create(completion);
      }

      return completion;
    }).then((res) => {
      if (res) notifyDataChanged('completionService.completeQuest');
      return res;
    });
  },

  /**
   * Undo a quest completion.
   * Reverts instance status to 'pending' and deletes the completion record.
   */
  async undoCompletion(instanceId: string): Promise<boolean> {
    return db.transaction('rw', [db.questInstances, db.completionRecords], async () => {
      const instance = await questInstanceRepository.getById(instanceId);
      if (!instance || instance.status !== 'completed') return false;

      // Delete the completion record
      await completionRepository.deleteByInstanceId(instanceId);

      // Revert instance status
      await questInstanceRepository.updateStatus(instanceId, 'pending');

      return true;
    }).then((res) => {
      if (res) notifyDataChanged('completionService.undoCompletion');
      return res;
    });
  },

  /**
   * Skip a quest instance.
   * Creates a completion record with status 'skipped' and 0 XP.
   */
  async skipQuest(instanceId: string): Promise<QuestCompletion | null> {
    return db.transaction('rw', [db.questInstances, db.completionRecords, db.quests], async () => {
      const instance = await questInstanceRepository.getById(instanceId);
      if (!instance || instance.status !== 'pending') return null;

      const quest = await questRepository.getById(instance.questId);
      const questTitle = quest?.title ?? 'Unknown Quest';
      const questCategory = quest?.category ?? 'Other';
      const questDifficulty = quest?.difficulty ?? 'normal';

      const completion: QuestCompletion = {
        id: generateId(),
        questId: instance.questId,
        questInstanceId: instance.id,
        questTitle,
        questCategory,
        questDifficulty,
        date: instance.date,
        status: 'skipped',
        xpEarned: 0,
      };

      await questInstanceRepository.updateStatus(instance.id, 'skipped');
      await completionRepository.create(completion);

      return completion;
    }).then((res) => {
      if (res) notifyDataChanged('completionService.skipQuest');
      return res;
    });
  },

  /**
   * Undo a skip.
   * Reverts instance status to 'pending' and deletes the completion record.
   */
  async undoSkip(instanceId: string): Promise<boolean> {
    return db.transaction('rw', [db.questInstances, db.completionRecords], async () => {
      const instance = await questInstanceRepository.getById(instanceId);
      if (!instance || instance.status !== 'skipped') return false;

      await completionRepository.deleteByInstanceId(instanceId);
      await questInstanceRepository.updateStatus(instanceId, 'pending');

      return true;
    }).then((res) => {
      if (res) notifyDataChanged('completionService.undoSkip');
      return res;
    });
  },

  /**
   * Reopen a completed quest instance.
   * Reverts instance status to 'pending'. The completion record is PRESERVED
   * so that re-completion correctly detects the prior completion and awards 0 XP.
   *
   * This method should be used by UI components instead of directly
   * manipulating the instance status via the repository.
   */
  async reopenQuest(instanceId: string): Promise<boolean> {
    return db.transaction('rw', [db.questInstances], async () => {
      const instance = await questInstanceRepository.getById(instanceId);
      if (!instance || instance.status !== 'completed') return false;

      await questInstanceRepository.updateStatus(instanceId, 'pending');
      return true;
    }).then((res) => {
      if (res) notifyDataChanged('completionService.reopenQuest');
      return res;
    });
  },

  /**
   * Postpone a quest instance to a future date.
   * Marks current instance as 'skipped' and creates a new instance on the target date.
   */
  async postponeQuest(instanceId: string, targetDate: string): Promise<QuestInstance | null> {
    return db.transaction('rw', [db.questInstances, db.completionRecords, db.quests], async () => {
      const instance = await questInstanceRepository.getById(instanceId);
      if (!instance || instance.status !== 'pending') return null;

      // Check if an instance already exists on the target date
      const existing = await questInstanceRepository.getByQuestAndDate(instance.questId, targetDate);
      if (existing) return null; // Don't create duplicate

      const now = nowISO();

      // Mark current instance as skipped with postpone reference
      await questInstanceRepository.update({
        ...instance,
        status: 'skipped',
        postponedTo: targetDate,
        updatedAt: now,
      });

      // Create skip completion record for the original date
      const quest = await questRepository.getById(instance.questId);
      await completionRepository.create({
        id: generateId(),
        questId: instance.questId,
        questInstanceId: instance.id,
        questTitle: quest?.title ?? 'Unknown Quest',
        questCategory: quest?.category ?? 'Other',
        questDifficulty: quest?.difficulty ?? 'normal',
        date: instance.date,
        status: 'skipped',
        xpEarned: 0,
      });

      // Create new instance on the target date
      const newInstance: QuestInstance = {
        id: generateId(),
        questId: instance.questId,
        date: targetDate,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      await questInstanceRepository.create(newInstance);
      return newInstance;
    }).then((res) => {
      if (res) notifyDataChanged('completionService.postponeQuest');
      return res;
    });
  },
};
