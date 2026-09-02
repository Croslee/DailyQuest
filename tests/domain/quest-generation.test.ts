import { describe, it, expect } from 'vitest';
import { shouldGenerateInstance, findMissedInstances } from '@/domain/quest-generation';
import type { Quest, QuestInstance } from '@/types/quest';

function makeQuest(recurrence: Quest['recurrence'], archived = false, id = 'q1'): Quest {
  return {
    id,
    title: 'Test Quest',
    category: 'Work',
    difficulty: 'normal',
    xp: 20,
    recurrence,
    priority: 'medium',
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
    archived,
  };
}

describe('shouldGenerateInstance', () => {
  it('generates instance for daily quest when none exists for today', () => {
    const quest = makeQuest({ type: 'daily' });
    const res = shouldGenerateInstance(quest, '2026-08-30', []);
    expect(res).toBe(true);
  });

  it('does not generate duplicate instance if one already exists today', () => {
    const quest = makeQuest({ type: 'daily' });
    const existing = [{ questId: 'q1', date: '2026-08-30' }];
    const res = shouldGenerateInstance(quest, '2026-08-30', existing);
    expect(res).toBe(false);
  });

  it('never generates for archived quests', () => {
    const quest = makeQuest({ type: 'daily' }, true);
    const res = shouldGenerateInstance(quest, '2026-08-30', []);
    expect(res).toBe(false);
  });

  it('handles once quests: generates only on first occurrence', () => {
    const quest = makeQuest({ type: 'once' });
    expect(shouldGenerateInstance(quest, '2026-08-30', [])).toBe(true);
    // When an instance already exists anywhere
    expect(shouldGenerateInstance(quest, '2026-08-31', [{ questId: 'q1', date: '2026-08-30' }])).toBe(false);
  });

  it('handles scheduled quests: generates only on exact scheduled date', () => {
    const quest = makeQuest({ type: 'scheduled', date: '2026-09-01' });
    expect(shouldGenerateInstance(quest, '2026-08-30', [])).toBe(false);
    expect(shouldGenerateInstance(quest, '2026-09-01', [])).toBe(true);
  });

  it('handles weekly recurrence for selected weekdays', () => {
    // Mon (1), Wed (3), Fri (5)
    const quest = makeQuest({ type: 'weekly', days: [1, 3, 5] });

    // 2026-08-30 is Sunday (0) -> should NOT generate
    expect(shouldGenerateInstance(quest, '2026-08-30', [])).toBe(false);

    // 2026-08-31 is Monday (1) -> should generate
    expect(shouldGenerateInstance(quest, '2026-08-31', [])).toBe(true);

    // 2026-09-01 is Tuesday (2) -> should NOT generate
    expect(shouldGenerateInstance(quest, '2026-09-01', [])).toBe(false);

    // 2026-09-02 is Wednesday (3) -> should generate
    expect(shouldGenerateInstance(quest, '2026-09-02', [])).toBe(true);
  });
});

describe('findMissedInstances', () => {
  it('identifies pending instances from past days as missed', () => {
    const instances: QuestInstance[] = [
      { id: 'i1', questId: 'q1', date: '2026-08-28', status: 'pending', createdAt: '', updatedAt: '' },
      { id: 'i2', questId: 'q2', date: '2026-08-28', status: 'completed', createdAt: '', updatedAt: '' },
      { id: 'i3', questId: 'q3', date: '2026-08-30', status: 'pending', createdAt: '', updatedAt: '' }, // Today
    ];

    const missedIds = findMissedInstances(instances, '2026-08-30');
    expect(missedIds).toEqual(['i1']);
  });
});
