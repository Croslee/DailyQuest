import type { Quest, QuestInstance } from '@/types/quest';
import type { QuestCompletion } from '@/types/completion';
import type { DailyStats } from '@/types/statistics';
import { generateId } from '@/utils/id';
import { daysAgo, getLocalDateKey } from '@/utils/date';

/**
 * Creates sample quest templates.
 */
export function createSampleQuests(): Quest[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'quest-japanese',
      title: 'Study Japanese',
      category: 'Study',
      difficulty: 'normal',
      xp: 20,
      recurrence: { type: 'daily' },
      priority: 'high',
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
    {
      id: 'quest-exercise',
      title: 'Exercise 30 minutes',
      category: 'Health',
      difficulty: 'normal',
      xp: 20,
      recurrence: { type: 'daily' },
      priority: 'medium',
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
    {
      id: 'quest-docs',
      title: 'Read technical documentation',
      category: 'Work',
      difficulty: 'easy',
      xp: 10,
      recurrence: { type: 'daily' },
      priority: 'low',
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
    {
      id: 'quest-assignment',
      title: 'Finish project assignment',
      category: 'Work',
      difficulty: 'hard',
      xp: 30,
      recurrence: { type: 'once' },
      priority: 'high',
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
  ];
}

/**
 * Generate simulated historical user data for N days.
 */
export function generateHistoryFixture(dayCount: number): {
  quests: Quest[];
  questInstances: QuestInstance[];
  completionRecords: QuestCompletion[];
  dailyStats: DailyStats[];
} {
  const quests = createSampleQuests();
  const questInstances: QuestInstance[] = [];
  const completionRecords: QuestCompletion[] = [];
  const dailyStats: DailyStats[] = [];

  for (let i = dayCount - 1; i >= 0; i--) {
    const date = daysAgo(i);
    const dayInstances: QuestInstance[] = [];
    let completedCount = 0;
    let skippedCount = 0;
    let missedCount = 0;
    let dayXP = 0;

    for (const q of quests.slice(0, 3)) {
      const instanceId = generateId();
      // Simulate ~80% success rate
      const roll = (i + q.title.length) % 10;
      let status: 'completed' | 'skipped' | 'missed' = 'completed';

      if (roll === 0) {
        status = 'missed';
        missedCount++;
      } else if (roll === 1) {
        status = 'skipped';
        skippedCount++;
      } else {
        status = 'completed';
        completedCount++;
        dayXP += q.xp;
      }

      const instance: QuestInstance = {
        id: instanceId,
        questId: q.id,
        date,
        status,
        createdAt: `${date}T08:00:00.000Z`,
        updatedAt: `${date}T20:00:00.000Z`,
      };
      dayInstances.push(instance);
      questInstances.push(instance);

      completionRecords.push({
        id: generateId(),
        questId: q.id,
        questInstanceId: instanceId,
        questTitle: q.title,
        questCategory: q.category,
        questDifficulty: q.difficulty,
        date,
        status,
        completedAt: status === 'completed' ? `${date}T18:00:00.000Z` : undefined,
        xpEarned: status === 'completed' ? q.xp : 0,
      });
    }

    const actionable = dayInstances.length - skippedCount;
    const score = actionable > 0 ? Math.round((completedCount / actionable) * 1000) / 10 : 0;

    dailyStats.push({
      date,
      totalQuests: dayInstances.length,
      completed: completedCount,
      skipped: skippedCount,
      missed: missedCount,
      pending: 0,
      score,
      xpEarned: dayXP,
      isSuccessful: score >= 70,
    });
  }

  return {
    quests,
    questInstances,
    completionRecords,
    dailyStats,
  };
}
