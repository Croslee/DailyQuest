import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/database';
import { storageService } from '@/services/storageService';

describe('StorageService (P4 Diagnostics)', () => {
  beforeEach(async () => {
    await db.quests.clear();
    await db.questInstances.clear();
    await db.completionRecords.clear();
  });

  it('returns valid storage health diagnostics and record counts', async () => {
    // Seed some test data
    await db.quests.add({
      id: 'q1',
      title: 'Quest 1',
      category: 'Work',
      difficulty: 'normal',
      priority: 'medium',
      recurrence: { type: 'daily' },
      xp: 20,
      archived: false,
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z',
    });

    const health = await storageService.getStorageHealth();
    expect(health).toBeDefined();
    expect(health.recordCounts.quests).toBe(1);
    expect(health.status).toBe('optimal');
    expect(health.isWarning).toBe(false);
    expect(health.usageFormatted).toBeDefined();
    expect(health.quotaFormatted).toBeDefined();
  });
});
