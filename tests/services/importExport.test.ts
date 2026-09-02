import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/index';
import { exportService } from '@/services/exportService';
import { importService } from '@/services/importService';
import { obsidianExportService } from '@/services/obsidianExportService';
import { generateHistoryFixture } from '../fixtures/testData';
import { questService } from '@/services/questService';
import { questInstanceRepository, dailyStatsRepository } from '@/db/index';
import { getLocalDateKey, nowISO } from '@/utils/date';
import { generateId } from '@/utils/id';

describe('Export & Import Roundtrip & Verification', () => {
  beforeEach(async () => {
    await db.quests.clear();
    await db.questInstances.clear();
    await db.completionRecords.clear();
    await db.dailyStats.clear();
  });

  it('exports selective date range and imports roundtrip without data loss', async () => {
    // 1. Seed 14 days of data
    const fixture = generateHistoryFixture(14);
    await db.quests.bulkAdd(fixture.quests);
    await db.questInstances.bulkAdd(fixture.questInstances);
    await db.completionRecords.bulkAdd(fixture.completionRecords);
    await db.dailyStats.bulkAdd(fixture.dailyStats);

    const from = fixture.dailyStats[0].date;
    const to = fixture.dailyStats[fixture.dailyStats.length - 1].date;

    // 2. Generate JSON export
    const { data: exportedJson, filename } = await exportService.generateJSON(from, to);
    expect(filename).toContain('dailyquest-');
    expect(exportedJson.quests.length).toBeGreaterThan(0);
    expect(exportedJson.completionRecords.length).toBeGreaterThan(0);

    // 3. Clear database completely
    await db.quests.clear();
    await db.questInstances.clear();
    await db.completionRecords.clear();
    await db.dailyStats.clear();

    expect(await db.quests.count()).toBe(0);
    expect(await db.completionRecords.count()).toBe(0);

    // 4. Import the JSON back
    const importResult = await importService.importData(exportedJson);
    expect(importResult.success).toBe(true);
    expect(importResult.inserted.quests).toBe(exportedJson.quests.length);
    expect(importResult.inserted.completionRecords).toBe(exportedJson.completionRecords.length);

    // 5. Verify database counts
    expect(await db.quests.count()).toBe(exportedJson.quests.length);
    expect(await db.completionRecords.count()).toBe(exportedJson.completionRecords.length);

    // 6. Test duplicate import safety
    const duplicateResult = await importService.importData(exportedJson);
    expect(duplicateResult.success).toBe(true);
    expect(duplicateResult.inserted.quests).toBe(0);
    expect(duplicateResult.skipped.quests).toBe(exportedJson.quests.length);
  });

  it('generates valid RFC 4180 CSV export with Unicode characters and quotes', async () => {
    const fixture = generateHistoryFixture(3);
    await db.quests.bulkAdd(fixture.quests);
    await db.questInstances.bulkAdd(fixture.questInstances);
    await db.completionRecords.bulkAdd(fixture.completionRecords);

    const from = fixture.dailyStats[0].date;
    const to = fixture.dailyStats[fixture.dailyStats.length - 1].date;

    const { data: csvString, filename } = await exportService.generateCSV(from, to);
    expect(filename.endsWith('.csv')).toBe(true);
    expect(csvString).toContain('Date,Quest,Category,Difficulty,Priority,Status,XP');
    expect(csvString).toContain('Study Japanese');
  });

  it('verifies Obsidian daily note markdown export structure', async () => {
    const today = getLocalDateKey();
    const q1 = await questService.create({
      title: 'Deep Work "Coding"',
      description: 'Finish all P3 features & tests',
      category: 'Work',
      difficulty: 'hard',
      xp: 40,
      priority: 'high',
      subtasks: [
        { id: 's1', title: 'Write tests', completed: true },
        { id: 's2', title: 'Build extension', completed: true },
      ],
    });

    await questInstanceRepository.create({
      id: generateId(),
      questId: q1.id,
      date: today,
      status: 'completed',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      subtasks: [
        { id: 's1', title: 'Write tests', completed: true },
        { id: 's2', title: 'Build extension', completed: true },
      ],
    });

    await dailyStatsRepository.upsert({
      date: today,
      totalQuests: 1,
      completed: 1,
      skipped: 0,
      missed: 0,
      pending: 0,
      score: 100,
      xpEarned: 40,
      isSuccessful: true,
    });

    const md = await obsidianExportService.generateDailyNoteMarkdown(today);

    expect(md).toContain('---');
    expect(md).toContain(`date: ${today}`);
    expect(md).toContain('daily_score: 100%');
    expect(md).toContain('xp_earned: 40');
    expect(md).toContain('Deep Work "Coding"');
    expect(md).toContain('#work');
    expect(md).toContain('[x] Write tests');
    expect(md).toContain('[x] Build extension');
  });
});
