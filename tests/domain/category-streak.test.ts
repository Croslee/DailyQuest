import { describe, it, expect } from 'vitest';
import { calculateCategoryStreaks } from '@/domain/category-streak';
import type { QuestCompletion } from '@/types/completion';
import { getLocalDateKey, getPreviousDateKey } from '@/utils/date';

describe('calculateCategoryStreaks', () => {
  const today = getLocalDateKey();
  const yesterday = getPreviousDateKey(today);
  const twoDaysAgo = getPreviousDateKey(yesterday);

  it('calculates category streaks correctly for consecutive completed quests', () => {
    const completions: QuestCompletion[] = [
      {
        id: 'c1',
        questId: 'q1',
        questInstanceId: 'qi1',
        questTitle: 'Gym',
        questCategory: 'Health',
        questDifficulty: 'normal',
        date: today,
        status: 'completed',
        xpEarned: 20,
      },
      {
        id: 'c2',
        questId: 'q1',
        questInstanceId: 'qi2',
        questTitle: 'Gym',
        questCategory: 'Health',
        questDifficulty: 'normal',
        date: yesterday,
        status: 'completed',
        xpEarned: 20,
      },
      {
        id: 'c3',
        questId: 'q1',
        questInstanceId: 'qi3',
        questTitle: 'Gym',
        questCategory: 'Health',
        questDifficulty: 'normal',
        date: twoDaysAgo,
        status: 'completed',
        xpEarned: 20,
      },
      {
        id: 'c4',
        questId: 'q2',
        questInstanceId: 'qi4',
        questTitle: 'Study Kanji',
        questCategory: 'Study',
        questDifficulty: 'easy',
        date: today,
        status: 'completed',
        xpEarned: 10,
      },
    ];

    const results = calculateCategoryStreaks(completions);

    const health = results.find(r => r.category === 'Health');
    expect(health?.currentStreak).toBe(3);
    expect(health?.totalCompletions).toBe(3);

    const study = results.find(r => r.category === 'Study');
    expect(study?.currentStreak).toBe(1);
    expect(study?.totalCompletions).toBe(1);
  });
});
