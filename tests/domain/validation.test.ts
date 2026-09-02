import { describe, it, expect } from 'vitest';
import {
  validateQuestTitle,
  validateImportData,
  isValidQuest,
  isValidCompletion,
} from '@/domain/validation';

describe('validateQuestTitle', () => {
  it('returns error for empty string or whitespace only', () => {
    expect(validateQuestTitle('')).not.toBeNull();
    expect(validateQuestTitle('   ')).not.toBeNull();
  });

  it('accepts valid titles', () => {
    expect(validateQuestTitle('Study Japanese')).toBeNull();
  });

  it('rejects titles longer than 200 chars', () => {
    const long = 'A'.repeat(201);
    expect(validateQuestTitle(long)).not.toBeNull();
  });
});

describe('validateImportData', () => {
  it('validates a correct import payload', () => {
    const payload = {
      schemaVersion: 1,
      exportedAt: '2026-08-30T00:00:00.000Z',
      dateRange: { from: '2026-08-01', to: '2026-08-30' },
      quests: [],
      questInstances: [],
      completionRecords: [],
      dailyStats: [],
    };
    const errors = validateImportData(payload);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid or future schema versions', () => {
    const payload = {
      schemaVersion: 99,
      exportedAt: '2026-08-30T00:00:00.000Z',
      dateRange: { from: '2026-08-01', to: '2026-08-30' },
      quests: [],
      questInstances: [],
      completionRecords: [],
      dailyStats: [],
    };
    const errors = validateImportData(payload);
    expect(errors.some(e => e.field === 'schemaVersion')).toBe(true);
  });
});

describe('Type Guards', () => {
  it('validates Quest objects accurately', () => {
    const valid = {
      id: 'q1',
      title: 'Valid Quest',
      category: 'Health',
      difficulty: 'normal',
      xp: 20,
      recurrence: { type: 'daily' },
      priority: 'high',
      createdAt: '2026-08-30',
      updatedAt: '2026-08-30',
      archived: false,
    };
    expect(isValidQuest(valid)).toBe(true);
    expect(isValidQuest({ ...valid, difficulty: 'invalid' })).toBe(false);
  });

  it('rejects quest with missing recurrence.type', () => {
    const malformed = {
      id: 'q2',
      title: 'Bad Recurrence',
      category: 'Other',
      difficulty: 'normal',
      xp: 10,
      recurrence: { foo: 'bar' }, // missing type
      priority: 'medium',
      createdAt: '2026-08-30',
      updatedAt: '2026-08-30',
      archived: false,
    };
    expect(isValidQuest(malformed)).toBe(false);
  });

  it('rejects quest with invalid recurrence.type', () => {
    const malformed = {
      id: 'q3',
      title: 'Invalid Type',
      category: 'Other',
      difficulty: 'normal',
      xp: 10,
      recurrence: { type: 'biweekly' },
      priority: 'medium',
      createdAt: '2026-08-30',
      updatedAt: '2026-08-30',
      archived: false,
    };
    expect(isValidQuest(malformed)).toBe(false);
  });

  it('validates weekly recurrence requires valid days array', () => {
    const base = {
      id: 'q4',
      title: 'Weekly',
      category: 'Study',
      difficulty: 'normal',
      xp: 20,
      priority: 'high',
      createdAt: '2026-08-30',
      updatedAt: '2026-08-30',
      archived: false,
    };

    // Valid weekly
    expect(isValidQuest({ ...base, recurrence: { type: 'weekly', days: [1, 3, 5] } })).toBe(true);

    // Missing days
    expect(isValidQuest({ ...base, recurrence: { type: 'weekly' } })).toBe(false);

    // Empty days
    expect(isValidQuest({ ...base, recurrence: { type: 'weekly', days: [] } })).toBe(false);

    // Invalid day number
    expect(isValidQuest({ ...base, recurrence: { type: 'weekly', days: [7] } })).toBe(false);
  });

  it('validates scheduled recurrence requires valid date', () => {
    const base = {
      id: 'q5',
      title: 'Scheduled',
      category: 'Other',
      difficulty: 'easy',
      xp: 5,
      priority: 'low',
      createdAt: '2026-08-30',
      updatedAt: '2026-08-30',
      archived: false,
    };

    // Valid scheduled
    expect(isValidQuest({ ...base, recurrence: { type: 'scheduled', date: '2026-09-15' } })).toBe(true);

    // Missing date
    expect(isValidQuest({ ...base, recurrence: { type: 'scheduled' } })).toBe(false);

    // Invalid date format
    expect(isValidQuest({ ...base, recurrence: { type: 'scheduled', date: 'not-a-date' } })).toBe(false);
  });

  it('validates subtask array items if present', () => {
    const base = {
      id: 'q6',
      title: 'With Subtasks',
      category: 'Work',
      difficulty: 'hard',
      xp: 30,
      recurrence: { type: 'daily' },
      priority: 'high',
      createdAt: '2026-08-30',
      updatedAt: '2026-08-30',
      archived: false,
    };

    // Valid subtasks
    expect(isValidQuest({
      ...base,
      subtasks: [{ id: 'st1', title: 'Sub 1', completed: false }],
    })).toBe(true);

    // Invalid subtask (missing title)
    expect(isValidQuest({
      ...base,
      subtasks: [{ id: 'st1' }],
    })).toBe(false);

    // subtasks not an array
    expect(isValidQuest({
      ...base,
      subtasks: 'not-array',
    })).toBe(false);
  });

  it('validates QuestCompletion objects accurately', () => {
    const valid = {
      id: 'c1',
      questId: 'q1',
      questInstanceId: 'i1',
      questTitle: 'Japanese',
      questCategory: 'Study',
      questDifficulty: 'normal',
      date: '2026-08-30',
      status: 'completed',
      xpEarned: 20,
    };
    expect(isValidCompletion(valid)).toBe(true);
    expect(isValidCompletion({ ...valid, status: 'invalid' })).toBe(false);
  });
});

