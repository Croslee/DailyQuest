import { describe, it, expect } from 'vitest';
import { shouldGenerateInstance } from '@/domain/quest-generation';
import type { Quest } from '@/types/quest';
import { getDateRange, parseDateKey } from '@/utils/date';

describe('Recurrence Simulation: Daily & Weekly Verification', () => {
  const sampleDailyQuest: Quest = {
    id: 'quest-daily-1',
    title: 'Study Japanese Daily',
    category: 'Study',
    difficulty: 'normal',
    xp: 20,
    recurrence: { type: 'daily' },
    priority: 'high',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    archived: false,
  };

  const sampleWeeklyQuest: Quest = {
    id: 'quest-weekly-gym',
    title: 'Gym Workout (Mon, Wed, Fri)',
    category: 'Health',
    difficulty: 'hard',
    xp: 30,
    // 1 = Mon, 3 = Wed, 5 = Fri
    recurrence: { type: 'weekly', days: [1, 3, 5] },
    priority: 'high',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    archived: false,
  };

  it('verifies Daily quest generates exactly once every day across a 30-day period', () => {
    const dates = getDateRange('2026-08-01', '2026-08-30');
    expect(dates).toHaveLength(30);

    const generatedInstances: { questId: string; date: string }[] = [];

    for (const date of dates) {
      // 1. Check if should generate
      const shouldGen = shouldGenerateInstance(sampleDailyQuest, date, generatedInstances);
      expect(shouldGen).toBe(true);

      // 2. Add instance to database/history simulation
      generatedInstances.push({ questId: sampleDailyQuest.id, date });

      // 3. Re-checking the same date must return FALSE (idempotency / no duplicates)
      const duplicateCheck = shouldGenerateInstance(sampleDailyQuest, date, generatedInstances);
      expect(duplicateCheck).toBe(false);
    }

    expect(generatedInstances).toHaveLength(30);
  });

  it('verifies Weekly quest repeats correctly every week only on selected days (Mon, Wed, Fri)', () => {
    // 3 full weeks: Aug 3 (Monday) to Aug 23 (Sunday), 2026
    const dates = getDateRange('2026-08-03', '2026-08-23');
    expect(dates).toHaveLength(21); // 3 weeks x 7 days

    const generatedInstances: { questId: string; date: string }[] = [];

    for (const date of dates) {
      const dateObj = parseDateKey(date);
      const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

      const shouldGen = shouldGenerateInstance(sampleWeeklyQuest, date, generatedInstances);

      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        // Must generate on Monday, Wednesday, Friday
        expect(shouldGen).toBe(true);
        generatedInstances.push({ questId: sampleWeeklyQuest.id, date });
      } else {
        // Must NOT generate on Sunday, Tuesday, Thursday, Saturday
        expect(shouldGen).toBe(false);
      }
    }

    // 3 weeks x 3 days/week = exactly 9 instances
    expect(generatedInstances).toHaveLength(9);

    // Verify all generated dates are strictly Mon, Wed, or Fri
    for (const inst of generatedInstances) {
      const day = parseDateKey(inst.date).getDay();
      expect([1, 3, 5]).toContain(day);
    }
  });

  it('verifies Weekly quest does not generate if archived', () => {
    const archivedQuest: Quest = { ...sampleWeeklyQuest, archived: true };
    // 2026-08-03 is Monday (1)
    const shouldGen = shouldGenerateInstance(archivedQuest, '2026-08-03', []);
    expect(shouldGen).toBe(false);
  });
});
