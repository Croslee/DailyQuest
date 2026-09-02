import { describe, it, expect, beforeEach } from 'vitest';
import { obsidianExportService } from '@/services/obsidianExportService';
import { questService } from '@/services/questService';
import { questInstanceRepository, dailyStatsRepository, db } from '@/db/index';
import { getLocalDateKey, nowISO } from '@/utils/date';
import { generateId } from '@/utils/id';

describe('obsidianExportService', () => {
  const today = getLocalDateKey();

  beforeEach(async () => {
    await db.quests.clear();
    await db.questInstances.clear();
    await db.dailyStats.clear();
  });

  it('generates Obsidian markdown with frontmatter and completed quests', async () => {
    const q1 = await questService.create({
      title: 'Morning Yoga',
      category: 'Health',
      difficulty: 'normal',
      xp: 20,
      priority: 'high',
      recurrence: { type: 'daily' },
      subtasks: [
        { id: 'st1', title: 'Sun salutation', completed: true },
        { id: 'st2', title: 'Meditation', completed: true },
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
        { id: 'st1', title: 'Sun salutation', completed: true },
        { id: 'st2', title: 'Meditation', completed: true },
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
      xpEarned: 20,
      isSuccessful: true,
    });

    const md = await obsidianExportService.generateDailyNoteMarkdown(today);

    expect(md).toContain('---');
    expect(md).toContain(`date: ${today}`);
    expect(md).toContain('daily_score: 100%');
    expect(md).toContain('Morning Yoga');
    expect(md).toContain('#health');
    expect(md).toContain('[x] **Morning Yoga**');
    expect(md).toContain('[x] Sun salutation');
  });
});
