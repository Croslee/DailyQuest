import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/index';
import { questService } from '@/services/questService';

describe('QuestService Integration', () => {
  beforeEach(async () => {
    await db.quests.clear();
    await db.questInstances.clear();
    await db.completionRecords.clear();
  });

  it('creates quest with defaults', async () => {
    const quest = await questService.create({
      title: 'Study Japanese',
      difficulty: 'normal',
    });

    expect(quest.id).toBeDefined();
    expect(quest.title).toBe('Study Japanese');
    expect(quest.xp).toBe(20); // Default normal XP
    expect(quest.priority).toBe('medium');
    expect(quest.archived).toBe(false);

    const stored = await questService.getById(quest.id);
    expect(stored?.title).toBe('Study Japanese');
  });

  it('updates an existing quest', async () => {
    const quest = await questService.create({ title: 'Exercise' });
    const updated = await questService.update(quest.id, { title: 'Exercise 45m', xp: 35 });

    expect(updated?.title).toBe('Exercise 45m');
    expect(updated?.xp).toBe(35);
  });

  it('archives and restores a quest without deleting data', async () => {
    const quest = await questService.create({ title: 'Read Book' });

    await questService.archive(quest.id);
    let active = await questService.getActive();
    expect(active.some(q => q.id === quest.id)).toBe(false);

    await questService.unarchive(quest.id);
    active = await questService.getActive();
    expect(active.some(q => q.id === quest.id)).toBe(true);
  });
});
