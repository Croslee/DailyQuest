import { describe, it, expect, beforeEach } from 'vitest';
import { db, questInstanceRepository, completionRepository } from '@/db/index';
import { questService } from '@/services/questService';
import { completionService } from '@/services/completionService';
import type { QuestInstance } from '@/types/quest';

describe('CompletionService Integration', () => {
  beforeEach(async () => {
    await db.quests.clear();
    await db.questInstances.clear();
    await db.completionRecords.clear();
  });

  it('completes a quest and saves immutable completion record with XP snapshot', async () => {
    const quest = await questService.create({
      title: 'Study Japanese',
      category: 'Study',
      xp: 20,
    });

    const instance: QuestInstance = {
      id: 'inst-today',
      questId: quest.id,
      date: '2026-08-30',
      status: 'pending',
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z',
    };
    await questInstanceRepository.create(instance);

    // Complete quest
    const record = await completionService.completeQuest(instance.id);
    expect(record).toBeDefined();
    expect(record?.status).toBe('completed');
    expect(record?.questTitle).toBe('Study Japanese');
    expect(record?.xpEarned).toBe(20);

    const updatedInstance = await questInstanceRepository.getById(instance.id);
    expect(updatedInstance?.status).toBe('completed');

    // Verify historical snapshot survives if quest template changes later
    await questService.update(quest.id, { title: 'Master Japanese', xp: 50 });
    const completionInDB = await completionRepository.getByInstanceId(instance.id);
    expect(completionInDB?.questTitle).toBe('Study Japanese'); // Snapshot preserved
    expect(completionInDB?.xpEarned).toBe(20); // Snapshot XP preserved
  });

  it('handles auto-reopen re-completion without duplicate XP (Method B)', async () => {
    const quest = await questService.create({
      title: 'Build API',
      category: 'Work',
      xp: 30,
    });

    const instance: QuestInstance = {
      id: 'inst-api',
      questId: quest.id,
      date: '2026-08-30',
      status: 'pending',
      subtasks: [
        { id: 'st-1', title: 'Write tests', completed: true },
        { id: 'st-2', title: 'Implement endpoints', completed: true },
      ],
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z',
    };
    await questInstanceRepository.create(instance);

    // 1. Initial complete
    const firstComp = await completionService.completeQuest(instance.id);
    expect(firstComp?.xpEarned).toBe(30);
    expect(await completionRepository.getTotalXP()).toBe(30);

    // 2. Reopen via service (not direct DB manipulation)
    const reopened = await completionService.reopenQuest(instance.id);
    expect(reopened).toBe(true);

    const reopenedInstance = await questInstanceRepository.getById(instance.id);
    expect(reopenedInstance?.status).toBe('pending');

    // Historical XP and completion record are preserved (not rolled back)
    expect(await completionRepository.getTotalXP()).toBe(30);

    // 3. Re-complete the quest
    const secondComp = await completionService.completeQuest(instance.id);
    expect(secondComp?.status).toBe('completed');
    expect(secondComp?.xpEarned).toBe(0); // 0 additional XP on re-completion!

    // Total XP in DB must still be exactly 30 (no double awarding)
    expect(await completionRepository.getTotalXP()).toBe(30);
    const finalInstance = await questInstanceRepository.getById(instance.id);
    expect(finalInstance?.status).toBe('completed');
  });

  it('re-completion persists updated completedAt timestamp to DB', async () => {
    const quest = await questService.create({ title: 'Persist Test', xp: 10 });
    const instance: QuestInstance = {
      id: 'inst-persist',
      questId: quest.id,
      date: '2026-08-30',
      status: 'pending',
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z',
    };
    await questInstanceRepository.create(instance);

    // Complete, reopen, re-complete
    const first = await completionService.completeQuest(instance.id);
    const firstTimestamp = first?.completedAt;

    await completionService.reopenQuest(instance.id);

    // Small delay to ensure timestamp differs
    await new Promise(r => setTimeout(r, 10));

    const second = await completionService.completeQuest(instance.id);
    expect(second?.completedAt).toBeDefined();
    expect(second?.completedAt).not.toBe(firstTimestamp);

    // Verify the DB actually has the updated timestamp (BUG-1 regression test)
    const dbRecord = await completionRepository.getByInstanceId(instance.id);
    expect(dbRecord?.completedAt).toBe(second?.completedAt);
    // DB preserves original XP; returned value signals 0 new XP
    expect(dbRecord?.xpEarned).toBe(10);
    expect(second?.xpEarned).toBe(0);
  });

  it('undos completion cleanly', async () => {
    const quest = await questService.create({ title: 'Exercise' });
    const instance: QuestInstance = {
      id: 'inst-ex',
      questId: quest.id,
      date: '2026-08-30',
      status: 'pending',
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z',
    };
    await questInstanceRepository.create(instance);

    await completionService.completeQuest(instance.id);
    let comp = await completionRepository.getByInstanceId(instance.id);
    expect(comp).toBeDefined();

    // Undo
    const undone = await completionService.undoCompletion(instance.id);
    expect(undone).toBe(true);

    const reverted = await questInstanceRepository.getById(instance.id);
    expect(reverted?.status).toBe('pending');

    comp = await completionRepository.getByInstanceId(instance.id);
    expect(comp).toBeUndefined();
  });

  it('skips quest and creates 0 XP record', async () => {
    const quest = await questService.create({ title: 'Clean Desk' });
    const instance: QuestInstance = {
      id: 'inst-skip',
      questId: quest.id,
      date: '2026-08-30',
      status: 'pending',
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z',
    };
    await questInstanceRepository.create(instance);

    const record = await completionService.skipQuest(instance.id);
    expect(record?.status).toBe('skipped');
    expect(record?.xpEarned).toBe(0);

    const updated = await questInstanceRepository.getById(instance.id);
    expect(updated?.status).toBe('skipped');
  });

  it('undoSkip reverts instance to pending and deletes skip record', async () => {
    const quest = await questService.create({ title: 'Read Book', xp: 15 });
    const instance: QuestInstance = {
      id: 'inst-undoskip',
      questId: quest.id,
      date: '2026-08-30',
      status: 'pending',
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z',
    };
    await questInstanceRepository.create(instance);

    // Skip, then undo
    await completionService.skipQuest(instance.id);
    const skippedInst = await questInstanceRepository.getById(instance.id);
    expect(skippedInst?.status).toBe('skipped');

    const result = await completionService.undoSkip(instance.id);
    expect(result).toBe(true);

    const revertedInst = await questInstanceRepository.getById(instance.id);
    expect(revertedInst?.status).toBe('pending');

    const comp = await completionRepository.getByInstanceId(instance.id);
    expect(comp).toBeUndefined();
  });

  it('skip → undoSkip → complete produces exactly one completion record with full XP', async () => {
    const quest = await questService.create({ title: 'Skip Then Do', xp: 25 });
    const instance: QuestInstance = {
      id: 'inst-skip-complete',
      questId: quest.id,
      date: '2026-08-30',
      status: 'pending',
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z',
    };
    await questInstanceRepository.create(instance);

    // Skip
    await completionService.skipQuest(instance.id);
    // Undo skip
    await completionService.undoSkip(instance.id);
    // Complete
    const comp = await completionService.completeQuest(instance.id);

    expect(comp?.status).toBe('completed');
    expect(comp?.xpEarned).toBe(25);

    // Verify exactly ONE record in DB for this instance
    const allRecords = await completionRepository.getAll();
    const instanceRecords = allRecords.filter(r => r.questInstanceId === instance.id);
    expect(instanceRecords.length).toBe(1);
    expect(instanceRecords[0].xpEarned).toBe(25);
  });

  it('postponeQuest creates skip record and new instance on target date', async () => {
    const quest = await questService.create({ title: 'Postpone Test', xp: 10 });
    const instance: QuestInstance = {
      id: 'inst-postpone',
      questId: quest.id,
      date: '2026-08-30',
      status: 'pending',
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z',
    };
    await questInstanceRepository.create(instance);

    const newInst = await completionService.postponeQuest(instance.id, '2026-08-31');
    expect(newInst).toBeDefined();
    expect(newInst?.date).toBe('2026-08-31');
    expect(newInst?.status).toBe('pending');

    // Original instance should be skipped
    const original = await questInstanceRepository.getById(instance.id);
    expect(original?.status).toBe('skipped');

    // Skip record should exist for the original date
    const skipRecord = await completionRepository.getByInstanceId(instance.id);
    expect(skipRecord?.status).toBe('skipped');
    expect(skipRecord?.date).toBe('2026-08-30');

    // Should not create duplicate if target date already has an instance
    const duplicate = await completionService.postponeQuest(newInst!.id, '2026-08-31');
    expect(duplicate).toBeNull();
  });

  it('reopenQuest returns false for non-completed instances', async () => {
    const quest = await questService.create({ title: 'Not Completed' });
    const instance: QuestInstance = {
      id: 'inst-reopen-fail',
      questId: quest.id,
      date: '2026-08-30',
      status: 'pending',
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z',
    };
    await questInstanceRepository.create(instance);

    const result = await completionService.reopenQuest(instance.id);
    expect(result).toBe(false);
  });
});
