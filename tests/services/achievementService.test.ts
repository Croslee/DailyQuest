import { describe, it, expect, beforeEach } from 'vitest';
import { achievementService } from '@/services/achievementService';
import { db, completionRepository } from '@/db/index';
import { nowISO } from '@/utils/date';

describe('achievementService (Milestone System Achievements)', () => {
  beforeEach(async () => {
    await db.completionRecords.clear();
    await db.quests.clear();
    await db.dailyStats.clear();
  });

  it('calculates live progress directly from completion counts', async () => {
    let achs = await achievementService.getAchievements();
    const firstStep = achs.find(a => a.id === 'quests-1');
    const quest100 = achs.find(a => a.id === 'quests-100');

    expect(firstStep?.unlocked).toBe(false);
    expect(firstStep?.currentCount).toBe(0);
    expect(firstStep?.targetCount).toBe(1);

    expect(quest100?.unlocked).toBe(false);
    expect(quest100?.currentCount).toBe(0);
    expect(quest100?.targetCount).toBe(100);

    // Complete 1 quest in Study category
    await completionRepository.create({
      id: 'c1',
      questId: 'q1',
      questInstanceId: 'inst1',
      questTitle: 'Study Math',
      questCategory: 'Study',
      questDifficulty: 'normal',
      date: '2026-09-01',
      status: 'completed',
      completedAt: nowISO(),
      xpEarned: 20,
    });

    achs = await achievementService.getAchievements();
    const firstStepAfter = achs.find(a => a.id === 'quests-1');
    const quest100After = achs.find(a => a.id === 'quests-100');
    const scholar = achs.find(a => a.id === 'scholar-10');

    expect(firstStepAfter?.unlocked).toBe(true);
    expect(firstStepAfter?.currentCount).toBe(1);
    expect(firstStepAfter?.progress).toBe(100);

    expect(quest100After?.unlocked).toBe(false);
    expect(quest100After?.currentCount).toBe(1);
    expect(quest100After?.targetCount).toBe(100);
    expect(quest100After?.progress).toBe(1);

    expect(scholar?.currentCount).toBe(1);
    expect(scholar?.targetCount).toBe(10);
    expect(scholar?.progress).toBe(10);
  });
});
