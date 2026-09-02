import type { Quest, CreateQuestInput, UpdateQuestInput } from '@/types/quest';
import { questRepository, questInstanceRepository } from '@/db/index';
import { generateId } from '@/utils/id';
import { nowISO, getLocalDateKey } from '@/utils/date';
import { getDefaultXP } from '@/domain/xp';
import { XP_DEFAULTS } from '@/constants/defaults';
import { notifyDataChanged } from '@/services/syncChannel';

/**
 * QuestService — Manages quest template CRUD operations.
 * Handles creation with defaults, updates, archival, and deletion.
 */
export const questService = {
  /**
   * Create a new quest with sensible defaults.
   * Returns the created quest.
   */
  async create(input: CreateQuestInput): Promise<Quest> {
    const difficulty = input.difficulty ?? 'normal';
    const now = nowISO();

    const quest: Quest = {
      id: generateId(),
      title: input.title.trim(),
      description: input.description?.trim(),
      category: input.category ?? 'Other',
      difficulty,
      xp: input.xp ?? getDefaultXP(difficulty),
      recurrence: input.recurrence ?? { type: 'once' },
      priority: input.priority ?? 'medium',
      subtasks: input.subtasks,
      createdAt: now,
      updatedAt: now,
      archived: false,
    };

    await questRepository.create(quest);
    notifyDataChanged('questService.create');
    return quest;
  },

  /**
   * Update an existing quest.
   * Does NOT affect historical completion records.
   */
  async update(id: string, input: UpdateQuestInput): Promise<Quest | undefined> {
    const quest = await questRepository.getById(id);
    if (!quest) return undefined;

    const updated: Quest = {
      ...quest,
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.difficulty !== undefined && { difficulty: input.difficulty }),
      ...(input.xp !== undefined && { xp: input.xp }),
      ...(input.recurrence !== undefined && { recurrence: input.recurrence }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.subtasks !== undefined && { subtasks: input.subtasks }),
      updatedAt: nowISO(),
    };

    await questRepository.update(updated);

    // Also sync subtasks and title to today's active pending instance if present
    const today = getLocalDateKey();
    const todayInstances = await questInstanceRepository.getByDate(today);
    const instance = todayInstances.find(i => i.questId === id && i.status === 'pending');
    if (instance && input.subtasks !== undefined) {
      await questInstanceRepository.update({
        ...instance,
        subtasks: input.subtasks,
      });
    }

    notifyDataChanged('questService.update');
    return updated;
  },

  /**
   * Archive a quest (soft delete).
   * Historical records are preserved. Quest stops generating new instances.
   */
  async archive(id: string): Promise<void> {
    const quest = await questRepository.getById(id);
    if (!quest) return;

    await questRepository.update({
      ...quest,
      archived: true,
      updatedAt: nowISO(),
    });
    notifyDataChanged('questService.archive');
  },

  /**
   * Unarchive a quest.
   */
  async unarchive(id: string): Promise<void> {
    const quest = await questRepository.getById(id);
    if (!quest) return;

    await questRepository.update({
      ...quest,
      archived: false,
      updatedAt: nowISO(),
    });
    notifyDataChanged('questService.unarchive');
  },

  /**
   * Delete a quest permanently.
   * Historical completion records are PRESERVED.
   * Quest instances are NOT deleted.
   */
  async delete(id: string): Promise<void> {
    await questRepository.delete(id);
    notifyDataChanged('questService.delete');
  },

  /** Get all active (non-archived) quests */
  async getActive(): Promise<Quest[]> {
    return questRepository.getActive();
  },

  /** Get all quests including archived */
  async getAll(): Promise<Quest[]> {
    return questRepository.getAll();
  },

  /** Get a quest by ID */
  async getById(id: string): Promise<Quest | undefined> {
    return questRepository.getById(id);
  },
};
